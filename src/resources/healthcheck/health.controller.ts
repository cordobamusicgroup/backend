import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { PrismaHealthIndicator } from './prisma.health';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealthIndicator: PrismaHealthIndicator,
    private http: HttpHealthIndicator,
    private redisHealthIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealthIndicator.isHealthy('prisma'),
      () => this.redisHealthIndicator.isHealthy('redis'),
    ]);
  }
}