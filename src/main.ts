import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const seedService = app.get(SeedService);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:6060',
      'https://app.cordobamusicgroup.uk',
      'https://app.cmgdistro.dev',
      /\.cmg-app\.pages\.dev$/,
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(cookieParser());

  await seedService.runSeed();

  await app.listen(6060);
}

bootstrap();
