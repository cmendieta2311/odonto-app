import { Module } from '@nestjs/common';
import { ProformasService } from './proformas.service';
import { ProformasController } from './proformas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProformasController],
  providers: [ProformasService],
})
export class ProformasModule { }
