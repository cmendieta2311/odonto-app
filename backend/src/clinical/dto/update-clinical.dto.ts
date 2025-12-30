import { PartialType } from '@nestjs/mapped-types';
import { CreateClinicalDto } from './create-clinical.dto';

export class UpdateClinicalDto extends PartialType(CreateClinicalDto) {}
