import { IsNumber, IsOptional } from 'class-validator';

export class OpenCashDto {
    @IsNumber()
    @IsOptional()
    initialAmount?: number;
}
