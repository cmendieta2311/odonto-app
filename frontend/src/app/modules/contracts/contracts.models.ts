export enum PaymentMethod {
    CASH = 'CASH',
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    TRANSFER = 'TRANSFER',
    CREDIT = 'CREDIT'
}

export enum CreditStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    PARTIALLY_PAID = 'PARTIALLY_PAID'
}

export enum ContractStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface CreditSchedule {
    id: string;
    dueDate: string;
    amount: number;
    status: CreditStatus;
}

export interface Contract {
    id: string;
    quoteId: string;
    quote?: any; // Avoiding circular dependency complexity for now
    total: number;
    totalAmount?: number; // Backend uses totalAmount
    balance: number;
    status: ContractStatus;
    paymentMethod: PaymentMethod;
    installments?: number;
    schedule?: CreditSchedule[];
    creditSchedule?: CreditSchedule[]; // Backend uses creditSchedule
    createdAt?: string;
    updatedAt?: string;
}
