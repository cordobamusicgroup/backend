import { Module, Global } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { ProgressService } from './services/progress.service';
import { LoggerTxtService } from './services/logger-txt.service';
import { S3Service } from './services/s3.service';
import { PrismaModule } from 'src/resources/prisma/prisma.module';

@Global() // Si es un servicio global que usarás en varios módulos
@Module({
  imports: [PrismaModule],
  providers: [RedisService, ProgressService, LoggerTxtService, S3Service],
  exports: [RedisService, ProgressService, LoggerTxtService, S3Service], // Exporta para que otros módulos puedan usarlo
})
export class CommonModule {}
