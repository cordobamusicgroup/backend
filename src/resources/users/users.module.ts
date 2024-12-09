import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersAdminController } from './users-admin.controller';
import { PrismaModule } from 'src/resources/prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { UsersController } from './users.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UsersAdminController, UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
