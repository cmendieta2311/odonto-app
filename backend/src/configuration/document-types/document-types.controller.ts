import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DocumentTypesService } from './document-types.service';

@Controller('configuration/document-types')
@UseGuards(AuthGuard('jwt'))
export class DocumentTypesController {
    constructor(private readonly service: DocumentTypesService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }
}
