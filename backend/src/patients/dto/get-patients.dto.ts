import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetPatientsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;
}
