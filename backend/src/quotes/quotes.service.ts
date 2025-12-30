import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) { }

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

  findAll() {
    return this.prisma.quote.findMany({
      include: {
        patient: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' }
    });
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
    const { items, status, ...otherData } = updateQuoteDto;

    const quote = await this.prisma.quote.findUnique({ where: { id }, include: { items: true } });
    if (!quote) throw new NotFoundException('Quote not found');

    let total = Number(quote.total);

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
            status: status !== undefined ? status : undefined, // Explicitly set status
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
        })
      ]).then(results => results[1]); // Return the updated quote

    } else {
      // Just update other fields
      return this.prisma.quote.update({
        where: { id },
        data: {
          ...otherData,
          status: status !== undefined ? status : undefined
        },
        include: {
          patient: true,
          items: { include: { service: true } },
          contract: true
        }
      });
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
