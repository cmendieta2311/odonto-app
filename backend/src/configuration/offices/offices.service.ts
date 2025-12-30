import { Injectable } from '@nestjs/common';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OfficesService {
    constructor(private prisma: PrismaService) { }

    create(createOfficeDto: CreateOfficeDto) {
        return this.prisma.office.create({
            data: createOfficeDto,
        });
    }

    findAll() {
        return this.prisma.office.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.office.findUnique({
            where: { id },
        });
    }

    update(id: string, updateOfficeDto: UpdateOfficeDto) {
        return this.prisma.office.update({
            where: { id },
            data: updateOfficeDto,
        });
    }

    remove(id: string) {
        return this.prisma.office.delete({
            where: { id },
        });
    }
}
