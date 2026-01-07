import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetPaymentsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    contractId?: string;

    @IsOptional()
    @IsString()
    patientId?: string;
}
