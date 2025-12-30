import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { CreateClinicalDto } from './dto/create-clinical.dto';
import { UpdateClinicalDto } from './dto/update-clinical.dto';

@Controller('clinical')
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) { }

  @Post()
  create(@Body() createClinicalDto: CreateClinicalDto) {
    return this.clinicalService.create(createClinicalDto);
  }

  @Get()
  findAll() {
    return this.clinicalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clinicalService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClinicalDto: UpdateClinicalDto) {
    return this.clinicalService.update(id, updateClinicalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clinicalService.remove(id);
  }
}
