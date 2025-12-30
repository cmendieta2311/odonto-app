export enum InvoiceStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    DRAFT = 'DRAFT'
}

export enum InvoiceType {
    CONTADO = 'CONTADO',
    CREDITO = 'CREDITO'
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    discount?: number;
    taxRate?: number;
}

export interface Invoice {
    id: string;
    number: string;
    patientId: string;
    contractId?: string;
    amount: number;
    balance: number;
    type: InvoiceType;
    status: InvoiceStatus;
    issuedAt: Date | string;
    dueDate?: Date | string;
    items?: InvoiceItem[];
    patient?: any; // Replace with Patient interface if available
    contract?: any; // Replace with Contract interface if available
}

export interface CreateInvoiceItemDto {
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
}

export interface CreateInvoiceDto {
    patientId: string;
    contractId?: string;
    type?: InvoiceType;
    status?: InvoiceStatus;
    items: CreateInvoiceItemDto[];
    dueDate?: string;
    installments?: number;
}
