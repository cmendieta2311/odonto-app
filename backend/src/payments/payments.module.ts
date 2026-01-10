import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { CashModule } from '../cash/cash.module';

@Module({
  imports: [PrismaModule, CashModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule { }
