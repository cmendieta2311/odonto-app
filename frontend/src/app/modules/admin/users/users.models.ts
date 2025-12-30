export enum Role {
    ADMIN = 'ADMIN',
    ODONTOLOGO = 'ODONTOLOGO',
    RECEPCION = 'RECEPCION'
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateUserDto {
    email: string;
    name: string;
    password: string;
    role: Role;
}

export interface UpdateUserDto {
    email?: string;
    name?: string;
    password?: string;
    role?: Role;
}
