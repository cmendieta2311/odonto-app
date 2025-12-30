import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProformasService {
  constructor(private prisma: PrismaService) { }

  findAll() {
    return this.prisma.proforma.findMany({
      include: {
        contract: {
          include: { quote: { include: { patient: true } } },
        },
        items: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.proforma.findUnique({
      where: { id },
      include: {
        contract: {
          include: { quote: { include: { patient: true } } },
        },
        items: true,
      },
    });
  }
}
