import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentType } from '@prisma/client';

@Injectable()
export class PaymentMethodsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    const defaults = [
      { name: 'Efectivo', code: PaymentType.CASH, isCash: true, requiresReference: false },
      { name: 'Tarjeta', code: PaymentType.CREDIT_CARD, isCash: false, requiresReference: true },
      { name: 'Transferencia', code: PaymentType.TRANSFER, isCash: false, requiresReference: true },
    ];

    for (const method of defaults) {
      const exists = await this.prisma.paymentMethod.findFirst({
        where: { name: method.name, tenantId: 'default' },
      });

      if (!exists) {
        await this.prisma.paymentMethod.create({
          data: {
            ...method,
            tenantId: 'default',
          },
        });
        console.log(`Seeded payment method: ${method.name}`);
      }
    }
  }

  create(createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({
      data: {
        name: createPaymentMethodDto.name,
        code: createPaymentMethodDto.code,
        isCash: createPaymentMethodDto.isCash,
        requiresReference: createPaymentMethodDto.requiresReference,
        isActive: createPaymentMethodDto.isActive,
        tenantId: 'default'
      },
    });
  }

  findAll() {
    return this.prisma.paymentMethod.findMany({
      where: { isActive: true }
    });
  }

  findOne(id: string) {
    return this.prisma.paymentMethod.findUnique({
      where: { id }
    });
  }

  update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    return this.prisma.paymentMethod.update({
      where: { id },
      data: updatePaymentMethodDto,
    });
  }

  remove(id: string) {
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false }
    });
  }
}
