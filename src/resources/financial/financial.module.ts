// src/resources/financial/financial.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { BalancesController } from './balances/balances.controller';
import { FinancialService } from './financial.service';
import { BalancesService } from './balances/balances.service';
import { RouterModule } from '@nestjs/core';
import { ReportsController } from './reports/reports.controller';
import { BaseReportProcessor } from './reports/base-report.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'base-report',
      defaultJobOptions: {
        attempts: 3,
        backoff: 5000,
      },
    }),
    RouterModule.register([
      {
        path: 'financial',
        module: FinancialModule,
        children: [],
      },
    ]),
  ],
  providers: [
    FinancialService,
    PrismaService,
    BalancesService,
    BaseReportProcessor,
  ],
  controllers: [BalancesController, ReportsController],
})
export class FinancialModule {}
