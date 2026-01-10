import { PaymentType } from '@prisma/client';
import { IsEnum, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreatePaymentMethodDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(PaymentType)
    @IsNotEmpty()
    code: PaymentType;

    @IsBoolean()
    @IsOptional()
    requiresReference?: boolean;

    @IsBoolean()
    @IsOptional()
    isCash?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
