import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './resources/auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Apply the JWT Auth Guard globally
  app.useGlobalGuards(new JwtAuthGuard());

  await app.listen(3000);
}
bootstrap();
