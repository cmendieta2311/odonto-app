import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './configuration/catalog/catalog.module';
import { ServicesModule } from './services/services.module';
import { PatientsModule } from './patients/patients.module';
import { QuotesModule } from './quotes/quotes.module';
import { ContractsModule } from './contracts/contracts.module';
import { ProformasModule } from './proformas/proformas.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ClinicalModule } from './clinical/clinical.module';
import { OfficesModule } from './configuration/offices/offices.module';
import { SystemConfigModule } from './configuration/system-config/system-config.module';
import { DocumentTypesModule } from './configuration/document-types/document-types.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    ServicesModule,
    PatientsModule,
    QuotesModule,
    ContractsModule,
    ProformasModule,
    PaymentsModule,
    InvoicesModule,
    ClinicalModule,
    OfficesModule,
    SystemConfigModule,
    DocumentTypesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
