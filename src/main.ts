import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SeedService } from './seed/seed.service';
import { TrimPipe } from './common/pipe/trim.pipe';
import { logger } from './winston-logger'; // Import the logger

async function bootstrap() {
  // Initialize NestJS with Winston logger - ensure context is passed to all log methods
  const app = await NestFactory.create(AppModule, {
    logger: {
      log: (message, context) => logger.info(message, { context }),
      error: (message, trace, context) =>
        logger.error(`${message}${trace ? `\n${trace}` : ''}`, { context }),
      warn: (message, context) => logger.warn(message, { context }),
      debug: (message, context) => logger.debug?.(message, { context }),
      verbose: (message, context) => logger.verbose?.(message, { context }),
    },
  });

  const seedService = app.get(SeedService);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:6060',
      'https://app.cordobamusicgroup.uk',
      'https://app.cordobamusicgroup.co.uk',
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
    new TrimPipe(),
  );

  app.use(cookieParser());

  logger.info('🚀 Starting database seed...', { context: 'Bootstrap' });
  await seedService.runSeed();

  await app.listen(6060);
  logger.info(`🌍 Server is running at port 6060`, { context: 'Bootstrap' });
}

bootstrap();
