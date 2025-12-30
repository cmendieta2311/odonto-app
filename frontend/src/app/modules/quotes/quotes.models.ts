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
}

export interface Quote {
    id: string;
    patientId: string;
    patient?: Patient;
    items: QuoteItem[];
    total: number;
    status: QuoteStatus;
    createdAt: string;
    financingEnabled?: boolean;
    initialPayment?: number;
    installments?: number;
}
