import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateServiceDto {
    @IsUUID()
    @IsNotEmpty()
    categoryId: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsEnum(ServiceType)
    @IsNotEmpty()
    type: ServiceType;
}
