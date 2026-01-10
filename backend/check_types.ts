import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// @ts-ignore
const input: Prisma.PaymentMethodCreateInput = {
    code: 'CASH', // Check if this is valid in IDE/Run
    name: 'Test',
}
console.log('Types checked');
