// src/utils/jobProgress.util.ts
import { RedisService } from 'src/common/services/redis.service';

/**
 * Saves the current progress of a job to Redis.
 * @param {RedisService} redisService - The Redis service instance.
 * @param {string} redisKey - The base Redis key for tracking progress.
 * @param {string} jobId - The job ID.
 * @param {number} processedCount - Number of records processed so far.
 */
export async function saveProgress(
  redisService: RedisService,
  redisKey: string,
  jobId: string,
  processedCount: number,
): Promise<void> {
  await redisService.set(`${redisKey}:${jobId}`, processedCount.toString());
}

/**
 * Retrieves the last processed index for a job from Redis.
 * @param {RedisService} redisService - The Redis service instance.
 * @param {string} redisKey - The base Redis key for tracking progress.
 * @param {string} jobId - The job ID.
 * @returns {Promise<number>} - The last processed record index.
 */
export async function getLastProcessedIndex(
  redisService: RedisService,
  redisKey: string,
  jobId: string,
): Promise<number> {
  const lastIndex = await redisService.get(`${redisKey}:${jobId}`);
  return lastIndex ? parseInt(lastIndex, 10) : 0;
}
