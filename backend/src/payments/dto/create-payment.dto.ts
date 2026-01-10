import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, IsString } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePaymentDto {
    @IsOptional()
    @IsUUID()
    contractId?: string;

    @IsOptional()
    @IsUUID()
    invoiceId?: string;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsEnum(PaymentType)
    @IsOptional()
    method?: PaymentType;

    @IsOptional()
    @IsUUID()
    paymentMethodId?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    documentType?: 'INVOICE' | 'RECEIPT';
}
