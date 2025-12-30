import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceType {
    CONTADO = 'CONTADO',
    CREDITO = 'CREDITO'
}

export enum InvoiceStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    DRAFT = 'DRAFT'
}

export class CreateInvoiceItemDto {
    @IsString()
    description: string;

    @IsNumber()
    quantity: number;

    @IsNumber()
    unitPrice: number;

    @IsOptional()
    @IsNumber()
    discount?: number;

    @IsOptional()
    @IsNumber()
    taxRate?: number;
}

export class CreateInvoiceDto {
    @IsUUID()
    patientId: string;

    @IsOptional()
    @IsUUID()
    contractId?: string;

    @IsOptional()
    @IsEnum(InvoiceType)
    type?: InvoiceType;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    items: CreateInvoiceItemDto[];

    @IsOptional()
    @IsEnum(InvoiceStatus)
    status?: InvoiceStatus;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsNumber()
    installments?: number;
}
