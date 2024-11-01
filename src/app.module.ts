import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaService } from './resources/prisma/prisma.service';
import { UsersModule } from './resources/users/users.module';
import { AuthModule } from './resources/auth/auth.module';
import { PrismaModule } from './resources/prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './resources/healthcheck/health.module';
import { ClientsModule } from './resources/clients/clients.module';
import { RolesGuard } from './common/guards/roles.guard';
import { CountriesModule } from './resources/countries/countries.module';
import { FinancialModule } from './resources/financial/financial.module';
import { SeedService } from './seed/seed.service';
import { LabelsModule } from './resources/labels/labels.module';
import { EmailService } from './resources/email/email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { S3Module } from './providers/s3.module';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from './common/services/redis.module';
import { ImportsModule } from './resources/imports/imports.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('APP_REDIS_HOST'),
          port: configService.get('APP_REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),

    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'email-smtp.us-east-1.amazonaws.com', // SMTP de AWS SES
          port: 465, // Puerto de AWS SES para SMTP (465 para SSL, 587 para TLS)
          secure: true, // true para usar SSL
          auth: {
            user: config.get<string>('SMTP_USER'), // Tu access key de SES
            pass: config.get<string>('SMTP_PASSWORD'), // Tu secret key de SES
          },
        },
        defaults: {
          from: `Córdoba Music Group <${process.env.FROM_EMAIL}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(), // Usa Handlebars para plantillas
          options: {
            strict: true,
          },
        },
      }),
    }),
    ScheduleModule.forRoot(),
    S3Module,
    RedisModule,
    PrismaModule,
    UsersModule,
    ClientsModule,
    LabelsModule,
    AuthModule,
    HealthModule,
    CountriesModule,
    FinancialModule,
    ImportsModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    SeedService,
    EmailService,
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
