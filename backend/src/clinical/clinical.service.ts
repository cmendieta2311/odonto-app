import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClinicalDto } from './dto/create-clinical.dto';
import { UpdateClinicalDto } from './dto/update-clinical.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicalService {
  constructor(private prisma: PrismaService) { }

  async create(createClinicalDto: CreateClinicalDto) {
    const { serviceId, notes } = createClinicalDto;

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.servicePerformed.create({
      data: {
        serviceId,
        notes,
      },
      include: { service: true }
    });
  }

  findAll() {
    return this.prisma.servicePerformed.findMany({
      include: { service: true }
    });
  }

  findOne(id: string) {
    return this.prisma.servicePerformed.findUnique({
      where: { id },
      include: { service: true }
    });
  }

  update(id: string, updateClinicalDto: UpdateClinicalDto) {
    return this.prisma.servicePerformed.update({
      where: { id },
      data: updateClinicalDto
    });
  }

  remove(id: string) {
    return this.prisma.servicePerformed.delete({ where: { id } });
  }
}
