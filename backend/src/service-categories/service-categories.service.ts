import { Injectable, ConflictException } from '@nestjs/common';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceCategoriesService {
  constructor(private prisma: PrismaService) { }

  async create(createServiceCategoryDto: CreateServiceCategoryDto) {
    try {
      return await this.prisma.serviceCategory.create({
        data: createServiceCategoryDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.serviceCategory.findMany();
  }

  findOne(id: string) {
    return this.prisma.serviceCategory.findUnique({ where: { id } });
  }

  update(id: string, updateServiceCategoryDto: UpdateServiceCategoryDto) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data: updateServiceCategoryDto,
    });
  }

  remove(id: string) {
    return this.prisma.serviceCategory.delete({ where: { id } });
  }
}
