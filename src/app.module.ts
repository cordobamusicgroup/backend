import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './resources/users/users.module';
import { AuthModule } from './resources/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { ReportsModule } from './resources/reports/reports.module';
import { APP_GUARD } from '@nestjs/core';
import { PublicGuard } from './common/guards/public.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DmbModule } from './resources/dmb/dmb.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 9002,
      },
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ReportsModule,
    DmbModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
