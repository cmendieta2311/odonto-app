import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

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

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    method: PaymentMethod;

    @IsOptional()
    @IsString()
    notes?: string;
}
