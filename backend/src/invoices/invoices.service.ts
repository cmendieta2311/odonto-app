import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto, CreateInvoiceItemDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) { }

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { patientId, contractId, items, dueDate, type } = createInvoiceDto;

    // Calculate total
    const totalAmount = items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = item.discount || 0;
      const taxAmount = (subtotal - discountAmount) * ((item.taxRate || 10) / 100);
      return sum + (subtotal - discountAmount + taxAmount);
    }, 0);

    // Generate number (Simple logic for now, ideally should use a sequence)
    const count = await this.prisma.invoice.count();
    const number = `F-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    return this.prisma.invoice.create({
      data: {
        number,
        patientId,
        contractId,
        type: type || 'CONTADO',
        amount: totalAmount,
        balance: totalAmount, // Initial balance = total
        status: (createInvoiceDto.status || 'PENDING') as any,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        items: {
          create: items.map(item => {
            const subtotal = item.quantity * item.unitPrice;
            const discountAmount = item.discount || 0;
            const taxAmount = (subtotal - discountAmount) * ((item.taxRate || 10) / 100);
            const total = subtotal - discountAmount + taxAmount;

            return {
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: discountAmount,
              taxRate: item.taxRate || 10, // Default 10%
              total: total
            };
          })
        }
      },
      include: {
        items: true,
        patient: true
      }
    });
  }

  findAll(params: { search?: string; status?: string; startDate?: string; endDate?: string } = {}) {
    const { search, status, startDate, endDate } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status && status !== 'Todos') {
      // Create a mapping or use strict checking if frontend sends correct enum values
      // Frontend sends 'Pagado', 'Pendiente', 'Cancelado' or 'Todos'
      // We need to map these to InvoiceStatus enum: 'PAID', 'PENDING', 'CANCELLED'
      let statusEnum = status;
      if (status === 'Pagado') statusEnum = 'PAID';
      else if (status === 'Pendiente') statusEnum = 'PENDING';
      else if (status === 'Cancelado') statusEnum = 'CANCELLED';
      else if (status === 'Parcial') statusEnum = 'PARTIALLY_PAID';

      // Check if valid enum value before applying
      if (['PAID', 'PENDING', 'CANCELLED', 'PARTIALLY_PAID'].includes(statusEnum)) {
        where.status = statusEnum;
      }
    }

    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) {
        where.issuedAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day if it's just a date string, or trust the exact ISO string
        // Usually it's better to add 1 day and use lt for end date to include the full day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.issuedAt.lte = end;
      }
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        patient: true,
        items: true,
        payment: true
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: true,
        payment: true,
        contract: true
      }
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    return `This action updates a #${id} invoice`;
  }

  remove(id: string) {
    return `This action removes a #${id} invoice`;
  }
}
