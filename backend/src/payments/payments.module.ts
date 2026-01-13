import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { CashModule } from '../cash/cash.module';

import { SystemConfigModule } from '../configuration/system-config/system-config.module';

@Module({
  imports: [PrismaModule, CashModule, SystemConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule { }
