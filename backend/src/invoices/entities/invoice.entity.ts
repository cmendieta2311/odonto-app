import { InvoiceStatus } from '@prisma/client';

export class Invoice {
    id: string;
    number: string;
    patientId: string;
    contractId?: string;
    amount: number;
    balance: number;
    status: InvoiceStatus;
    issuedAt: Date;
    dueDate?: Date;
}
