import { PrismaClient, PaymentType } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
    const methods = [
        { name: 'Efectivo', code: PaymentType.CASH, isCash: true, requiresReference: false },
        { name: 'Tarjeta de Crédito', code: PaymentType.CREDIT_CARD, isCash: false, requiresReference: true },
        { name: 'Tarjeta de Débito', code: PaymentType.DEBIT_CARD, isCash: false, requiresReference: true },
        { name: 'Transferencia', code: PaymentType.TRANSFER, isCash: false, requiresReference: true },
        { name: 'Crédito de la Casa', code: PaymentType.CREDIT, isCash: false, requiresReference: false },
    ];

    for (const method of methods) {
        const existing = await prisma.paymentMethod.findFirst({
            where: { name: method.name, tenantId: 'default' }
        });

        if (!existing) {
            await prisma.paymentMethod.create({
                data: {
                    ...method,
                    tenantId: 'default'
                }
            });
            console.log(`Seeded payment method: ${method.name}`);
        } else {
            console.log(`Payment method already exists: ${method.name}`);
        }
    }
};

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
