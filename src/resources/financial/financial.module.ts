import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { BalancesService } from './balances.service';
@Module({
  imports: [PrismaModule],
  providers: [FinancialService, BalancesService, PrismaService],
  controllers: [FinancialController],
})
export class FinancialModule {}
