import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClinicalDto {
    @IsUUID()
    @IsNotEmpty()
    serviceId: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
