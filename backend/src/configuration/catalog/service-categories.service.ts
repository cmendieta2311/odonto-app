import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServiceCategoriesService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.serviceCategory.findMany({
            include: { area: true }
        });
    }

    async create(data: { name: string; areaId: string }) {
        try {
            return await this.prisma.serviceCategory.create({
                data: {
                    name: data.name,
                    areaId: data.areaId,
                    tenantId: 'default'
                }
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Category name already exists');
            }
            throw error;
        }
    }

    update(id: string, data: { name: string; areaId?: string }) {
        return this.prisma.serviceCategory.update({
            where: { id },
            data
        });
    }

    remove(id: string) {
        return this.prisma.serviceCategory.delete({
            where: { id }
        });
    }
}
