export interface PaymentIndex {
    id: string;
    contractId?: string;
    invoiceId?: string;
    amount: number;
    method: string;
    createdAt: string;
}

export interface CreatePaymentDto {
    contractId?: string;
    invoiceId?: string;
    amount: number;
    method: string;
}
