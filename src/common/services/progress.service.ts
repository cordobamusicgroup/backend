// src/common/services/progress.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/services/redis.service';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly redisService: RedisService) {}

  async getLastProcessedIndex(
    redisKey: string,
    jobId: string,
  ): Promise<number> {
    const index = await this.redisService.get(
      `${redisKey}:${jobId}:lastProcessedIndex`,
    );
    return index ? parseInt(index, 10) : 0;
  }

  async saveProgress(
    redisKey: string,
    jobId: string,
    recordIndex: number,
  ): Promise<void> {
    await this.redisService.set(
      `${redisKey}:${jobId}:lastProcessedIndex`,
      recordIndex.toString(),
    );
  }

  calculateAndUpdateProgress(
    job: any,
    totalRecords: number,
    currentIndex: number,
  ): void {
    const percentage = Math.floor((currentIndex / totalRecords) * 100);
    job.updateProgress(percentage);
    if (currentIndex % Math.ceil(totalRecords / 10) === 0) {
      this.logger.log(`[JOB ${job.id}] Processing... ${percentage}% completed`);
    }
  }
}
