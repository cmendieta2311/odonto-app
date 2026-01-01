import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
    constructor(private prisma: PrismaService) { }

    create(createAppointmentDto: CreateAppointmentDto) {
        return this.prisma.appointment.create({
            data: {
                ...createAppointmentDto,
                startTime: new Date(createAppointmentDto.startTime),
                endTime: new Date(createAppointmentDto.endTime),
            },
        });
    }

    findAll(start?: string, end?: string) {
        const whereClause: any = {};

        if (start && end) {
            whereClause.startTime = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        return this.prisma.appointment.findMany({
            where: whereClause,
            include: {
                patient: true,
                dentist: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });
    }

    findOne(id: string) {
        return this.prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: true,
                dentist: true,
            },
        });
    }

    update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
        const data: any = { ...updateAppointmentDto };

        if (updateAppointmentDto.startTime) {
            data.startTime = new Date(updateAppointmentDto.startTime);
        }
        if (updateAppointmentDto.endTime) {
            data.endTime = new Date(updateAppointmentDto.endTime);
        }

        return this.prisma.appointment.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.appointment.delete({
            where: { id },
        });
    }
}
