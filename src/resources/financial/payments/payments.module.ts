import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from 'src/resources/users/users.module';
import { PaymentsUserController } from './payments-user.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [PaymentsService],
  controllers: [PaymentsUserController],
})
export class PaymentsModule {}
