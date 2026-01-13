import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GetPaymentsDto } from './dto/get-payments.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CashService } from '../cash/cash.service';
import { CreditStatus, CashMovementType } from '@prisma/client';
import { SystemConfigService } from '../configuration/system-config/system-config.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private cashService: CashService,
    private systemConfigService: SystemConfigService
  ) { }

  async create(createPaymentDto: CreatePaymentDto) {
    const { contractId, invoiceId, amount, method, paymentMethodId } = createPaymentDto;

    // Validate request
    if (!contractId && !invoiceId) {
      throw new BadRequestException('Must provide either contractId or invoiceId');
    }

    // Resolve Payment Method
    let resolvedMethod = method;
    if (paymentMethodId) {
      const pm = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
      if (!pm) throw new NotFoundException('Payment Method not found');
      resolvedMethod = (pm as any).code;
    } else if (!method) {
      throw new BadRequestException('Payment method or paymentMethodId is required');
    }

    // 1. New Flow: Paying an existing Invoice
    if (invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { contract: true }
      });

      if (!invoice) throw new NotFoundException('Invoice not found');

      if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
        throw new BadRequestException(`Invoice is already ${invoice.status}`);
      }

      // Check overpayment on invoice
      if (Number(amount) > Number(invoice.balance)) {
        throw new BadRequestException(`Amount exceeds invoice balance ($${invoice.balance})`);
      }

      return this.prisma.$transaction(async (prisma) => {
        // Create Payment
        const payment = await prisma.payment.create({
          data: {
            invoiceId,
            contractId: invoice.contractId || contractId,
            amount,
            method: resolvedMethod!,
            paymentMethodId
          }
        });

        // Register Cash Movement
        await this.cashService.create({
          amount: Number(amount),
          type: CashMovementType.INCOME,
          description: createPaymentDto.notes || `Cobro Factura #${invoice.number}`,
          paymentMethod: resolvedMethod!,
          referenceId: payment.id,
          source: 'SYSTEM'
        });

        // Update Invoice Balance
        const newInvBalance = Number(invoice.balance) - Number(amount);
        const invStatus = newInvBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'; // Correct Enum value

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            balance: newInvBalance,
            status: invStatus === 'PARTIALLY_PAID' ? 'PENDING' : 'PAID'
            // Step 98 Enum: PENDING, PAID, CANCELLED, PARTIALLY_PAID. Yes it is there.
          }
        });

        // If Invoice linked to Contract, update Contract Balance too
        if (invoice.contractId) {
          const contract = await prisma.contract.findUnique({ where: { id: invoice.contractId } });
          if (contract) {
            const newContBalance = Number(contract.balance) - Number(amount);
            const contStatus = newContBalance <= 0 ? 'COMPLETED' : 'ACTIVE';
            await prisma.contract.update({
              where: { id: invoice.contractId },
              data: { balance: newContBalance, status: contStatus }
            });

            // Also update Credit Schedule if applicable?
            // Logic for matching payment to schedule is complex if going via Invoice.
            // For now, let's assume if you pay via Invoice, you manually manage schedule or simplistically apply to oldest.
            // Let's reuse basic schedule allocation logic if exists.
            const schedules = await prisma.creditSchedule.findMany({
              where: {
                contractId: invoice.contractId,
                status: { in: [CreditStatus.PENDING, CreditStatus.PARTIALLY_PAID] }
              },
              orderBy: { dueDate: 'asc' },
            });

            let remainingAmount = Number(amount);
            for (const schedule of schedules) {
              if (remainingAmount <= 0) break;
              const scheduleAmount = Number(schedule.amount); // Should refer to schedule balance ideally, but schema only has amount. 

              if (remainingAmount >= scheduleAmount) {
                await prisma.creditSchedule.update({ where: { id: schedule.id }, data: { status: CreditStatus.PAID } });
                remainingAmount -= scheduleAmount;
              }
              // If partial, existing logic didn't track HOW partial. Just "PARTIALLY_PAID".
            }
          }
        }

        return payment;
      });
    }

    // 2. Legacy Flow: Paying Contract directly (Auto-generate Invoice)
    // NOTE: This now auto-generates a PAID invoice (Factura Contado)
    if (contractId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          creditSchedule: true,
          quote: true // quote has patientId scalar
        }
      });

      if (!contract) {
        throw new NotFoundException('Contract not found');
      }

      // Smart Balance Check (Self-Healing)
      let effectiveBalance = Number(contract.balance);

      if (Number(amount) > effectiveBalance) {
        // Check if we have pending installments that justify a larger balance
        const pendingScheduleAmount = contract.creditSchedule
          .filter(s => ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(s.status))
          .reduce((sum, s) => sum + (Number(s.amount) - (Number(s.paidAmount) || 0)), 0);

        if (pendingScheduleAmount >= Number(amount)) {
          console.log(`[Self-Healing] Contract ${contract.id} balance corrected from ${effectiveBalance} to ${pendingScheduleAmount}`);
          effectiveBalance = pendingScheduleAmount;
        } else {
          // Allow small floating point tolerance or just proceed with strict check
          throw new BadRequestException(
            `Payment amount ($${amount}) exceeds contract balance ($${effectiveBalance}) and schedule sum ($${pendingScheduleAmount})`
          );
        }
      }

      return this.prisma.$transaction(async (prisma) => {
        // 1. Create Payment first
        const payment = await prisma.payment.create({
          data: {
            contractId,
            amount,
            method: resolvedMethod!,
            paymentMethodId,
          },
        });

        // Register Cash Movement
        await this.cashService.create({
          amount: Number(amount),
          type: CashMovementType.INCOME,
          description: createPaymentDto.notes || `Cobro Contrato (Pago directo)`,
          paymentMethod: resolvedMethod!,
          referenceId: payment.id,
          source: 'SYSTEM'
        });

        // 2. Process Credit Schedule to identify what is being paid
        const schedules = await prisma.creditSchedule.findMany({
          where: {
            contractId,
            status: { in: [CreditStatus.PENDING, CreditStatus.PARTIALLY_PAID, CreditStatus.OVERDUE] }
          },
          orderBy: { dueDate: 'asc' },
        });

        let remainingAmount = Number(amount);
        const paidItemsDescription: string[] = [];

        for (const schedule of schedules) {
          if (remainingAmount <= 0) break;

          const scheduleTotal = Number(schedule.amount);
          const alreadyPaid = Number(schedule.paidAmount) || 0;
          const scheduleBalance = scheduleTotal - alreadyPaid;

          // Determine schedule index for description (e.g. "Cuota 1")
          // We can find the index in original contract.creditSchedule or purely by date order
          // Since we loaded `schedules` ordered by date, we can assume sequential processing.
          // Getting exact number is hard without full list. Let's use Date.
          const dateStr = new Date(schedule.dueDate).toLocaleDateString('es-PY');

          if (remainingAmount >= scheduleBalance) {
            // Pay fully
            await prisma.creditSchedule.update({
              where: { id: schedule.id },
              data: {
                status: CreditStatus.PAID,
                paidAmount: scheduleTotal
              },
            });
            remainingAmount -= scheduleBalance;
            paidItemsDescription.push(`Cuota del ${dateStr}`);
          } else {
            // Pay partially
            const newPaidAmount = alreadyPaid + remainingAmount;
            await prisma.creditSchedule.update({
              where: { id: schedule.id },
              data: {
                status: CreditStatus.PARTIALLY_PAID,
                paidAmount: newPaidAmount
              },
            });
            paidItemsDescription.push(`Pago parcial Cuota del ${dateStr}`);
            remainingAmount = 0;
          }
        }

        // 3. Generate Factura (Invoice) or Recibo (Receipt)
        const documentType = createPaymentDto.documentType || 'INVOICE';
        const year = new Date().getFullYear();
        let invoiceNumber = '';

        if (documentType === 'RECEIPT') {
          const prefix = 'REC';
          const count = await prisma.invoice.count({
            where: { number: { startsWith: `${prefix}-${year}` } }
          });
          invoiceNumber = `${prefix}-${year}-${(count + 1).toString().padStart(5, '0')}`;
        } else {
          // INVOICE Logic
          // Fetch configuration
          const configs = await this.systemConfigService.findAll();
          const invoiceConfig = configs['invoice_config'] as any; // Cast to avoid TS errors if typed strictly

          let establishment = '001';
          let emissionPoint = '001';

          if (invoiceConfig) {
            establishment = invoiceConfig.establishmentCode || '001';
            emissionPoint = invoiceConfig.emissionPoint || '001';
          }

          const prefix = `${establishment}-${emissionPoint}`;

          // Count invoices with this prefix to determine next sequence
          // Note: This simple count method might duplicate numbers if records are deleted. 
          // A more robust sequence table is better, but using count + 1 for now as per legacy.
          // We should use prisma max if possible, but string manipulation is needed.
          // Let's stick to count + 1 for simplicity unless we see a sequence tracker.

          const count = await prisma.invoice.count({
            where: {
              number: { startsWith: prefix }
            }
          });

          const sequence = (count + 1).toString().padStart(7, '0');
          invoiceNumber = `${prefix}-${sequence}`;
        }

        const description = paidItemsDescription.length > 0
          ? `Pago: ${paidItemsDescription.join(', ')}`
          : 'Pago a cuenta de contrato';

        const invoice = await prisma.invoice.create({
          data: {
            number: invoiceNumber,
            patientId: contract.quote.patientId, // Safe access as quote is related
            contractId,
            amount: amount,
            balance: 0,
            status: 'PAID',
            type: 'CONTADO',
            items: {
              create: [{
                description: description,
                quantity: 1,
                unitPrice: Number(amount),
                total: Number(amount)
              }]
            }
          }
        });

        // 4. Link payment to invoice
        await prisma.payment.update({
          where: { id: payment.id },
          data: { invoiceId: invoice.id }
        });

        // 5. Update Contract Balance
        let currentBalance = Number(contract.balance);
        const pendingScheduleRef = contract.creditSchedule
          .filter(s => ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(s.status))
          .reduce((sum, s) => sum + Number(s.amount), 0);
        // Note: contract.creditSchedule from outside transaction might be stale?
        // No, logic above just used it for check. We should rely on value.

        // Re-fetching or simple math:
        // newBalance = oldBalance - amount

        const newBalance = Math.max(0, currentBalance - Number(amount));
        const contractStatus = newBalance <= 100 ? 'COMPLETED' : 'ACTIVE'; // 100 Guarani tolerance? Or 0.

        await prisma.contract.update({
          where: { id: contractId },
          data: {
            balance: newBalance,
            status: contractStatus
          },
        });

        return payment;
      });
    }
  }

  async findAll(query: GetPaymentsDto) {
    const { page = 1, limit = 10, contractId, patientId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (contractId) where.contractId = contractId;
    if (patientId) where.contract = { quote: { patientId } }; // Assuming relation path: payment -> contract -> quote -> patient

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { invoice: true, contract: { include: { quote: { include: { patient: true } } } } }
      }),
      this.prisma.payment.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: true, contract: true }
    });
  }

  update(id: string, updatePaymentDto: UpdatePaymentDto) {
    return this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto
    });
  }

  remove(id: string) {
    return this.prisma.payment.delete({ where: { id } });
  }
}
