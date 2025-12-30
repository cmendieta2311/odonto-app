export enum ServiceType {
    CONSULTORIO = 'CONSULTORIO',
    LABORATORIO = 'LABORATORIO',
    TERCERIZADO = 'TERCERIZADO'
}

export interface ServiceArea {
    id: string;
    name: string;
    categories?: ServiceCategory[];
}

export interface ServiceCategory {
    id: string;
    name: string;
    areaId?: string;
    area?: ServiceArea;
}

export interface Service {
    id: string;
    categoryId: string;
    category?: ServiceCategory;
    code: string;
    name: string;
    price: number;
    type: ServiceType;
    active: boolean;
    description?: string;
}
