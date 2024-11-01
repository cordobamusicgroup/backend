import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {
    super();
    this.redisClient = new Redis({
      host: this.configService.get<string>('APP_REDIS_HOST'),
      port: this.configService.get<number>('APP_REDIS_PORT'),
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redisClient.ping();
      const isHealthy = result === 'PONG';
      return this.getStatus(key, isHealthy);
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false),
      );
    }
  }
}
