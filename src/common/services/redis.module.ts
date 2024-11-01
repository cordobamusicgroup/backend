import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Si es un servicio global que usarás en varios módulos
@Module({
  providers: [RedisService],
  exports: [RedisService], // Exporta para que otros módulos puedan usarlo
})
export class RedisModule {}
