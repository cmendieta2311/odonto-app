import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProformasService } from './proformas.service';

@Controller('proformas')
export class ProformasController {
  constructor(private readonly proformasService: ProformasService) { }

  @Get()
  findAll() {
    return this.proformasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proformasService.findOne(id);
  }
}
