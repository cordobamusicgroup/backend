// src/common/services/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined, // Agrega password si es necesario
    });
  }

  onModuleInit() {
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  // Métodos de acceso a Redis
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    expiration?: number,
  ): Promise<'OK' | null> {
    if (expiration) {
      return this.client.set(key, value, 'EX', expiration);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  // Agrega otros métodos según sea necesario
}