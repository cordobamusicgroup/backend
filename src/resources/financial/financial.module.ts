// src/resources/financial/financial.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { BalancesController } from './balances/balances.controller';
import { FinancialService } from './financial.service';
import { BalancesService } from './balances/balances.service';
import { RouterModule } from '@nestjs/core';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    ReportsModule,
    RouterModule.register([
      {
        path: 'financial',
        module: FinancialModule,
        children: [
          {
            path: 'reports',
            module: ReportsModule,
          },
        ],
      },
    ]),
  ],
  providers: [FinancialService, PrismaService, BalancesService],
  controllers: [BalancesController],
})
export class FinancialModule {}
