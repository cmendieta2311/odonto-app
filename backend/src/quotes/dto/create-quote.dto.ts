import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, Max, ValidateNested } from 'class-validator';
import { QuoteStatus } from '@prisma/client';

class CreateQuoteItemDto {
    @IsUUID()
    @IsNotEmpty()
    serviceId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    discount?: number;
}

export class CreateQuoteDto {
    @IsUUID()
    @IsNotEmpty()
    patientId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuoteItemDto)
    items: CreateQuoteItemDto[];

    @IsEnum(QuoteStatus)
    @IsOptional()
    status?: QuoteStatus;

    @IsBoolean()
    @IsOptional()
    financingEnabled?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    initialPayment?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    installments?: number;
}
