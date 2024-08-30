import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './resources/users/users.module';
import { AuthModule } from './resources/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DmbModule } from './resources/external/dmb/dmb.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './resources/healthcheck/health.module';
import { ClientsModule } from './resources/clients/clients.module';
import { RolesGuard } from './common/guards/roles.guard';
import { CountriesModule } from './resources/countries/countries.module';
import { CookieResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        fallbackLanguage: configService.getOrThrow('FALLBACK_LANGUAGE'),
        loaderOptions: {
          path: join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      resolvers: [new CookieResolver(['user_locale'])],
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    ClientsModule,
    AuthModule,
    DmbModule,
    HealthModule,
    CountriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
