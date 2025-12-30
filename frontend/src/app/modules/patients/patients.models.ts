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
}
