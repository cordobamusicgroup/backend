import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from 'src/resources/users/users.module';
import { PaymentsUserController } from './payments-user.controller';
import { PaymentsUserService } from './payments-user.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [PrismaModule, UsersModule, MailerModule],
  providers: [PaymentsUserService],
  controllers: [PaymentsUserController],
})
export class PaymentsModule {}
