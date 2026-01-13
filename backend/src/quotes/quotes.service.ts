import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus, CreditStatus } from '@prisma/client';
import { GetQuotesDto } from './dto/get-quotes.dto';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) { }
  // Trigger restart for schema update

  async create(createQuoteDto: CreateQuoteDto) {
    console.log('Creating Quote:', JSON.stringify(createQuoteDto));
    const { patientId, items, financingEnabled, initialPayment, installments, status } = createQuoteDto;

    // Validate patient
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate services and calculate total
    let total = 0;
    const quoteItemsData: any[] = [];

    if (items && items.length > 0) {
      for (const item of items) {
        const service = await this.prisma.service.findUnique({
          where: { id: item.serviceId },
        });
        if (!service) {
          throw new NotFoundException(`Service with ID ${item.serviceId} not found`);
        }

        const price = Number(service.price);
        const discount = item.discount || 0;
        const discountedPrice = price * (1 - discount / 100);
        total += discountedPrice * item.quantity;

        quoteItemsData.push({
          serviceId: item.serviceId,
          price: service.price,
          quantity: item.quantity,
          discount: discount
        });
      }
    }

    // Create Quote
    return this.prisma.quote.create({
      data: {
        patientId,
        total,
        status: status || QuoteStatus.DRAFT,
        financingEnabled: financingEnabled || false,
        initialPayment: initialPayment || 0,
        installments: installments || 1,
        observations: createQuoteDto.observations,
        items: {
          create: quoteItemsData,
        },
      },
      include: {
        items: {
          include: { service: true }
        },
        patient: true,
      },
    });
  }

  async findAll(params: GetQuotesDto) {
    const { page = 1, limit = 10, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      const searchTerms = search.trim().split(/\s+/);

      where.OR = [
        // DNI Search (exact or partial)
        {
          patient: {
            dni: { contains: search, mode: 'insensitive' }
          }
        },
        // Name Search (handle multiple terms)
        {
          AND: searchTerms.map(term => ({
            patient: {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } }
              ]
            }
          }))
        }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        skip,
        take: limit,
        where,
        include: {
          patient: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.quote.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  findOne(id: string) {
    return this.prisma.quote.findUnique({
      where: { id },
      include: {
        patient: true,
        items: {
          include: { service: true },
        },
      },
    });
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto) {
    console.log('Updating Quote:', id, JSON.stringify(updateQuoteDto));
    const { items, status, patientId, ...otherData } = updateQuoteDto;

    const quote = await this.prisma.quote.findUnique({ where: { id }, include: { items: true, contract: true } });
    if (!quote) throw new NotFoundException('Quote not found');

    let total = Number(quote.total);

    let finalStatus = status;
    const additionalOps: any[] = [];

    // Check if we need to auto-generate contract (Status APPROVED + No existing contract)
    if (status === QuoteStatus.APPROVED && !quote.contract) {
      finalStatus = QuoteStatus.CONVERTED;

      const finalFinancing = otherData.financingEnabled ?? quote.financingEnabled;
      const finalInitialPayment = Number(otherData.initialPayment ?? quote.initialPayment);
      const finalInstallments = Number(otherData.installments ?? quote.installments);

      // Calculate final total
      let finalTotal = Number(quote.total);
      if (items) {
        // Re-calculate total from new items
        finalTotal = 0;
        for (const item of items) {
          const service = await this.prisma.service.findUnique({ where: { id: item.serviceId } });
          if (service) {
            const price = Number(service.price);
            const discount = item.discount || 0;
            finalTotal += (price * (1 - discount / 100)) * item.quantity;
          }
        }
      }

      const paymentMethod = finalFinancing ? 'CREDIT' : 'CASH';
      const contractId = crypto.randomUUID(); // We need ID for credit schedule relations

      // Contract Creation Op
      additionalOps.push(this.prisma.contract.create({
        data: {
          id: contractId,
          quoteId: id,
          totalAmount: finalTotal,
          balance: finalTotal,
          paymentMethod: paymentMethod,
          installments: finalInstallments,
          status: 'ACTIVE'
        }
      }));

      // Credit Schedule Creation Op
      if (paymentMethod === 'CREDIT' && finalInstallments > 1) {
        const installmentAmount = (finalTotal - finalInitialPayment) / finalInstallments;
        const today = new Date();

        for (let i = 1; i <= finalInstallments; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + i);

          additionalOps.push(this.prisma.creditSchedule.create({
            data: {
              contractId: contractId,
              amount: installmentAmount,
              dueDate: dueDate,
              status: CreditStatus.PENDING
            }
          }));
        }
      }
    }

    // If items are being updated, we need to recalculate total and replace items
    if (items) {
      total = 0;
      // We will perform a transaction to delete old items and add new ones
      // But first validation
      const newItemsData: any[] = [];

      for (const item of items) {
        const service = await this.prisma.service.findUnique({ where: { id: item.serviceId } });
        if (!service) throw new NotFoundException(`Service ${item.serviceId} not found`);

        const price = Number(service.price);
        const discount = item.discount || 0;
        const discountedPrice = price * (1 - discount / 100);
        total += discountedPrice * item.quantity;

        newItemsData.push({
          serviceId: item.serviceId,
          price: service.price,
          quantity: item.quantity,
          discount: discount
        });
      }

      // Update with items replacement
      return this.prisma.$transaction([
        this.prisma.quoteItem.deleteMany({ where: { quoteId: id } }),
        this.prisma.quote.update({
          where: { id },
          data: {
            ...otherData,
            status: finalStatus !== undefined ? finalStatus : undefined,
            total,
            items: {
              create: newItemsData
            }
          },
          include: {
            patient: true,
            items: { include: { service: true } },
            contract: true
          }
        }),
        ...additionalOps
      ]).then(results => results[1]);

    } else {
      // Just update other fields
      // Use transaction if we have additional ops (contract creation)
      if (additionalOps.length > 0) {
        return this.prisma.$transaction([
          this.prisma.quote.update({
            where: { id },
            data: {
              ...otherData,
              status: finalStatus !== undefined ? finalStatus : undefined
            },
            include: {
              patient: true,
              items: { include: { service: true } },
              contract: true
            }
          }),
          ...additionalOps
        ]).then(results => results[0]);
      } else {
        return this.prisma.quote.update({
          where: { id },
          data: {
            ...otherData,
            status: finalStatus !== undefined ? finalStatus : undefined
          },
          include: {
            patient: true,
            items: { include: { service: true } },
            contract: true
          }
        });
      }
    }
  }

  async remove(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { contract: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.contract) {
      throw new BadRequestException('Cannot delete quote with an active contract');
    }

    // Delete items first if cascade is not set (Prisma usually handles this but being safe)
    await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });

    return this.prisma.quote.delete({ where: { id } });
  }
}
