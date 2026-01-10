import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreateContractDto {
    @IsUUID()
    @IsNotEmpty()
    quoteId: string;

    @IsEnum(PaymentType)
    @IsOptional()
    paymentMethod: PaymentType;

    @IsInt()
    @Min(1)
    installments: number = 1;
}
