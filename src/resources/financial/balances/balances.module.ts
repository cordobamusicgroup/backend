import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from 'src/resources/users/users.module';
import { BalancesService } from './balances.service';
import { BalancesUserController } from './balances.user.controller';
import { BalancesAdminController } from './controllers/admin/balances.admin.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [BalancesService],
  controllers: [BalancesUserController, BalancesAdminController],
})
export class BalancesModule {}
