import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServiceAreasController } from './service-areas.controller';
import { ServiceAreasService } from './service-areas.service';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';
import { ServicesService } from '../../services/services.service';
import { ServicesController } from '../../services/services.controller';

// Note: I am importing ServicesService/Controller here or should I import ServicesModule?
// For now, let's keep Services separate or check if I should move them here too.
// The user asked for "Areas and Categories". Let's stick to those.

@Module({
    imports: [PrismaModule],
    controllers: [ServiceAreasController, ServiceCategoriesController],
    providers: [ServiceAreasService, ServiceCategoriesService],
    exports: [ServiceAreasService, ServiceCategoriesService]
})
export class CatalogModule { }
