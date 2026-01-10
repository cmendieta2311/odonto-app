import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { CashMovementType, PaymentType } from '@prisma/client';

export class CreateCashMovementDto {
  @IsEnum(CashMovementType)
  @IsNotEmpty()
  type: CashMovementType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(PaymentType)
  @IsOptional()
  paymentMethod?: PaymentType;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  source?: string;
}
