import { Module } from '@nestjs/common';
import { UsersAdminService } from './admin/users-admin.service';
import { UsersAdminController } from './admin/users-admin.controller';
import { PrismaModule } from 'src/resources/prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { UsersController } from './public/users.controller';
import { UsersProfileService } from './public/users-profile.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersAdminController, UsersController],
  providers: [UsersAdminService, PrismaService],
  exports: [UsersAdminService],
})
export class UsersModule {}
