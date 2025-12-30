export class Payment {
    id: string;
    contractId?: string;
    invoiceId?: string;
    amount: number;
    date: Date;
    method: string;
}
