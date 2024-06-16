import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma/prisma.module';
import { PrismaService } from './prisma/prisma/prisma.service';
import { Module } from './users/.module';
import { UsersModule } from './users/users/users.module';

@Module({
  imports: [PrismaModule, Module, UsersModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
