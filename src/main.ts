import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SeedService } from './seed/seed.service';
import { TrimPipe } from './common/pipe/trim.pipe';
import { logger } from './winston-logger'; // Import the logger
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // Swagger/OpenAPI desactivado
  // const config = new DocumentBuilder()
  //   .setTitle('Cats example')
  //   .setDescription('The cats API description')
  //   .setVersion('1.0')
  //   .addTag('cats')
  //   .build();
  // const documentFactory = () => SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, documentFactory);

  // Leer orígenes CORS desde variable de entorno y permitir wildcards
  const corsOriginsEnv = process.env.CORS_ORIGINS || '';
  const corsOrigins = corsOriginsEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  function matchOrigin(origin: string, allowedOrigins: string[]): boolean {
    for (const allowed of allowedOrigins) {
      if (allowed.startsWith('*.')) {
        // Permitir subdominios wildcard
        const domain = allowed.replace(/^\*\./, '');
        if (origin.endsWith('.' + domain) || origin === domain) {
          return true;
        }
      } else if (allowed === origin) {
        return true;
      }
    }
    return false;
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origen (como Postman)
      if (!origin) return callback(null, true);
      if (matchOrigin(origin, corsOrigins)) {
        return callback(null, true);
      }
      return callback(
        new Error(`Not allowed by CORS. Attempted origin: ${origin}`),
        false,
      );
    },
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
