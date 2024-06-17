import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './resources/auth/guards/jwt-auth.guard';
import { PublicGuard } from './resources/auth/guards/public.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new PublicGuard(reflector), new JwtAuthGuard(reflector));

  await app.listen(3000);
}
bootstrap();
