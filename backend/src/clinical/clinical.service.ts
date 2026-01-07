import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClinicalDto } from './dto/create-clinical.dto';
import { UpdateClinicalDto } from './dto/update-clinical.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicalService {
  constructor(private prisma: PrismaService) { }

  async create(createClinicalDto: CreateClinicalDto) {
    const { serviceId, patientId, notes } = createClinicalDto;

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.servicePerformed.create({
      data: {
        serviceId,
        patientId,
        notes,
        toothNumber: createClinicalDto.toothNumber,
        surface: createClinicalDto.surface,
      },
      include: { service: true, patient: true }
    });
  }

  findAll(patientId?: string) {
    const where = patientId ? { patientId } : {};
    return this.prisma.servicePerformed.findMany({
      where,
      include: { service: true, patient: true },
      orderBy: { date: 'desc' }
    });
  }

  findOne(id: string) {
    return this.prisma.servicePerformed.findUnique({
      where: { id },
      include: { service: true, patient: true }
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
