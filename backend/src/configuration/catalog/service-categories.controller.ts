import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';

@Controller('service-categories')
export class ServiceCategoriesController {
    constructor(private readonly serviceCategoriesService: ServiceCategoriesService) { }

    @Get()
    findAll() {
        return this.serviceCategoriesService.findAll();
    }

    @Post()
    create(@Body() data: { name: string; areaId: string }) {
        return this.serviceCategoriesService.create(data);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: { name: string; areaId?: string }) {
        return this.serviceCategoriesService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.serviceCategoriesService.remove(id);
    }
}
