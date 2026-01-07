export interface Patient {
    id: string;
    documentTypeId?: string;
    dni: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    history?: string;
    createdAt?: string; // or Date
    updatedAt?: string; // or Date
    birthDate?: string;
    gender?: 'M' | 'F' | 'O';
    civilStatus?: string;
    city?: string;
    postalCode?: string;
    documentType?: {
        id: string;
        code: string;
        name: string;
    };
}
