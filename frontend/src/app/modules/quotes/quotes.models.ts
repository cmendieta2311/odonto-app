import { Patient } from '../patients/patients.models';
import { Service } from '../catalog/catalog.models';

export enum QuoteStatus {
    DRAFT = 'DRAFT',
    APPROVED = 'APPROVED',
    CONVERTED = 'CONVERTED',
    REJECTED = 'REJECTED'
}

export interface QuoteItem {
    id?: string;
    serviceId: string;
    service?: Service;
    price?: number;
    quantity: number;
    discount?: number;
}

export interface Quote {
    id: string;
    number: number;
    patientId: string;
    patient?: Patient;
    items: QuoteItem[];
    total: number;
    status: QuoteStatus;
    createdAt: string;
    financingEnabled?: boolean;
    initialPayment?: number;
    installments?: number;
    observations?: string;
    firstPaymentDate?: string;
}
