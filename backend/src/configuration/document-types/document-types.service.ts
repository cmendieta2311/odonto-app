import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocumentTypesService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.personDocumentType.findMany({
            where: { isActive: true },
        });
    }
}
