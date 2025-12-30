import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServiceAreasService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.serviceArea.findMany({
            include: {
                categories: {
                    include: {
                        _count: {
                            select: { services: true }
                        }
                    }
                }
            }
        });
    }

    async create(data: { name: string }) {
        try {
            return await this.prisma.serviceArea.create({
                data: {
                    name: data.name,
                    tenantId: 'default'
                }
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Area name already exists');
            }
            throw error;
        }
    }

    update(id: string, data: { name: string }) {
        return this.prisma.serviceArea.update({
            where: { id },
            data
        });
    }

    async remove(id: string) {
        return this.prisma.$transaction(async (tx) => {
            // Check if there are services linked to categories in this area
            const categories = await tx.serviceCategory.findMany({
                where: { areaId: id },
                include: { _count: { select: { services: true } } }
            });

            const hasServices = categories.some(c => c._count.services > 0);
            if (hasServices) {
                throw new ConflictException('No se puede eliminar el área porque contiene servicios activos en sus categorías.');
            }

            // Delete categories first
            await tx.serviceCategory.deleteMany({
                where: { areaId: id }
            });

            // Delete the area
            return tx.serviceArea.delete({
                where: { id }
            });
        });
    }
}
