import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus, CreditStatus } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) { }

  async create(createContractDto: CreateContractDto) {
    const { quoteId, paymentMethod, installments } = createContractDto;

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: { include: { service: true } } },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('Quote already converted to contract');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Create Contract with balance = totalAmount (fully unpaid initially)
      const contract = await prisma.contract.create({
        data: {
          quoteId,
          totalAmount: quote.total,
          balance: quote.total, // Initialize balance with total amount
          paymentMethod,
          installments,
          status: 'ACTIVE',
        },
      });

      // Update Quote Status
      await prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.CONVERTED },
      });

      // Create Credit Schedule ONLY if payment method is CREDIT
      // This represents the payment plan (cuentas a cobrar)
      if (paymentMethod === 'CREDIT' && installments > 1) {
        const installmentAmount = Number(quote.total) / installments;
        const today = new Date();

        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + i);

          await prisma.creditSchedule.create({
            data: {
              contractId: contract.id,
              amount: installmentAmount,
              dueDate: dueDate,
              status: CreditStatus.PENDING,
            },
          });
        }
      }

      // NOTE: Proforma is NOT generated automatically
      // It's an optional informative document that can be generated on-demand
      // via the generateProforma() method

      return contract;
    });
  }

  // New method to generate Proforma on-demand (optional, informative document)
  async generateProforma(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        quote: { include: { items: { include: { service: true } } } },
        proforma: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.proforma) {
      throw new BadRequestException('Proforma already exists for this contract');
    }

    return this.prisma.proforma.create({
      data: {
        contractId: contract.id,
        total: contract.totalAmount,
        items: {
          create: contract.quote.items.map((item) => ({
            description: item.service.name,
            quantity: item.quantity,
            amount: item.price,
          })),
        },
      },
    });
  }

  findAll(patientId?: string) {
    const whereClause = patientId ? { quote: { patientId } } : {};
    return this.prisma.contract.findMany({
      where: whereClause,
      include: {
        quote: { include: { patient: true } },
        creditSchedule: {
          orderBy: { dueDate: 'asc' }
        }
      },
    });
  }

  findOne(id: string) {
    return this.prisma.contract.findUnique({
      where: { id },
      include: {
        quote: { include: { items: true, patient: true } },
        proforma: { include: { items: true } },
        creditSchedule: true,
      },
    });
  }

  update(id: string, updateContractDto: UpdateContractDto) {
    return this.prisma.contract.update({
      where: { id },
      data: updateContractDto,
    });
  }

  remove(id: string) {
    return this.prisma.contract.delete({ where: { id } });
  }
}
