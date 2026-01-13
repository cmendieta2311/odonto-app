import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) { }

  async create(createServiceDto: CreateServiceDto) {
    // Verify category exists
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: createServiceDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Service Category not found');
    }

    try {
      return await this.prisma.service.create({
        data: createServiceDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Service code already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.service.findMany({
      include: {
        category: {
          include: { area: true }
        }
      },
    });
  }

  async getTopServices(limit: number = 5) {
    const services = await this.prisma.service.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { quoteItems: true }
        }
      }
    });

    // Sort by usage count descending
    return services
      .sort((a, b) => b._count.quoteItems - a._count.quoteItems)
      .slice(0, limit);
  }

  findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  update(id: string, updateServiceDto: UpdateServiceDto) {
    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  remove(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }
}
