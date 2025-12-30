import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceAreasService } from './service-areas.service';

@Controller('service-areas')
export class ServiceAreasController {
    constructor(private readonly serviceAreasService: ServiceAreasService) { }

    @Get()
    findAll() {
        return this.serviceAreasService.findAll();
    }

    @Post()
    create(@Body() data: { name: string }) {
        return this.serviceAreasService.create(data);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: { name: string }) {
        return this.serviceAreasService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.serviceAreasService.remove(id);
    }
}
