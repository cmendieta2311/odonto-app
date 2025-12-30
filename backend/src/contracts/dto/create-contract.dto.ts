import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateContractDto {
    @IsUUID()
    @IsNotEmpty()
    quoteId: string;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    paymentMethod: PaymentMethod;

    @IsInt()
    @Min(1)
    installments: number = 1;
}
