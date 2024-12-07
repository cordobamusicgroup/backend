// src/resources/financial/financial.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { FinancialService } from './financial.service';
import { RouterModule } from '@nestjs/core';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from '../users/users.module';
import { BalancesModule } from './balances/balances.module';

@Module({
  imports: [
    PrismaModule,
    ReportsModule,
    BalancesModule,
    UsersModule,
    RouterModule.register([
      {
        path: 'financial',
        module: FinancialModule,
        children: [
          {
            path: 'reports',
            module: ReportsModule,
          },
          {
            path: 'balances',
            module: BalancesModule,
          },
        ],
      },
    ]),
  ],
  providers: [FinancialService, PrismaService],
})
export class FinancialModule {}
