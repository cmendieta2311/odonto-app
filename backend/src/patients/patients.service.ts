import { Injectable, ConflictException } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) { }

  async create(createPatientDto: CreatePatientDto) {
    try {
      return await this.prisma.patient.create({
        data: createPatientDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Patient DNI already exists');
      }
      throw error;
    }
  }

  findAll(search?: string) {
    if (search) {
      return this.prisma.patient.findMany({
        where: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { dni: { contains: search, mode: 'insensitive' } },
          ],
        },
      });
    }
    return this.prisma.patient.findMany();
  }

  findOne(id: string) {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  update(id: string, updatePatientDto: UpdatePatientDto) {
    return this.prisma.patient.update({
      where: { id },
      data: updatePatientDto,
    });
  }

  remove(id: string) {
    return this.prisma.patient.delete({ where: { id } });
  }
}
