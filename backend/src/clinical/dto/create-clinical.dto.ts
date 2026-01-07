import { IsNotEmpty, IsOptional, IsString, IsUUID, IsInt } from 'class-validator';

export class CreateClinicalDto {
    @IsUUID()
    @IsNotEmpty()
    serviceId: string;

    @IsUUID()
    @IsNotEmpty()
    patientId: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsInt()
    @IsOptional()
    toothNumber?: number;

    @IsString()
    @IsOptional()
    surface?: string;
}
