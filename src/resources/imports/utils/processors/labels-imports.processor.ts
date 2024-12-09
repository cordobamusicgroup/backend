// src/imports/import-processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { RedisService } from 'src/common/services/redis.service';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'fast-csv';
import { Logger, Injectable } from '@nestjs/common';
import { mapLabelCsvToIntermediate } from '../label-csv-mapper.util';

@Processor('label-import')
@Injectable()
export class LabelImportProcessor extends WorkerHost {
  private readonly logger = new Logger(LabelImportProcessor.name);
  private readonly redisKey = 'label-import:progress';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { filePath } = job.data;
    const errorLogPath = path.join(
      path.dirname(filePath),
      `error_log_${job.id}-label-import.txt`,
    );
    const lastProcessedIndex = await this.getLastProcessedIndex(job.id);

    this.logger.log(`[JOB ${job.id}] Starting CSV processing.`);
    this.logger.log(`[JOB ${job.id}] File path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      this.logger.error(`[JOB ${job.id}] File not found at path: ${filePath}`);
      return;
    }

    const records = await this.readCsvFile(filePath);
    if (records.length === 0) {
      this.logger.error(`[JOB ${job.id}] No records to process in CSV file.`);
      return;
    }

    this.logger.log(
      `[JOB ${job.id}] Total records loaded: ${records.length}. Resuming from index ${lastProcessedIndex}.`,
    );

    await this.processRecords(
      records.slice(lastProcessedIndex),
      job,
      errorLogPath,
      lastProcessedIndex,
    );

    await this.cleanUp(filePath, errorLogPath);
  }

  private async readCsvFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records = [];
      fs.createReadStream(filePath)
        .pipe(parse({ headers: true, ignoreEmpty: true, delimiter: ',' }))
        .on('data', (row) => {
          records.push(mapLabelCsvToIntermediate(row));
        })
        .on('end', () => resolve(records))
        .on('error', (error) => reject(error));
    });
  }

  private async processRecords(
    records: any[],
    job: Job,
    errorLogPath: string,
    initialIndex: number,
  ) {
    for (let i = 0; i < records.length; i++) {
      const recordIndex = initialIndex + i + 1;
      const { labelData, wp_id } = records[i];

      try {
        const client = await this.prisma.client.findUnique({
          where: { wp_id: wp_id },
        });

        this.logger.log(
          `wp_id: ${wp_id}, client: ${client ? client.id : 'No encontrado'}`,
        );

        if (!client) {
          throw new Error(`Cliente con wp_id ${wp_id} no encontrado.`);
        }

        const existingLabel = await this.prisma.label.findUnique({
          where: { name: labelData.name },
        });

        if (!existingLabel) {
          await this.prisma.label.create({
            data: {
              ...labelData,
              clientId: client.id,
            },
          });
        } else {
          throw new Error(`Label "${labelData.name}" already exists`);
        }

        await this.saveProgress(job.id, recordIndex);

        const percentage = Math.floor(((i + 1) / records.length) * 100);
        job.updateProgress(percentage);

        if ((i + 1) % Math.ceil(records.length / 10) === 0) {
          this.logger.log(
            `[JOB ${job.id}] Processing... ${percentage}% completed`,
          );
        }
      } catch (error) {
        this.logError(errorLogPath, `Row ${recordIndex}: ${error.message}`);
      }
    }
  }

  private async saveProgress(jobId: string, processedCount: number) {
    await this.redisService.set(
      `${this.redisKey}:${jobId}`,
      processedCount.toString(),
    );
  }

  private async getLastProcessedIndex(jobId: string): Promise<number> {
    const lastIndex = await this.redisService.get(`${this.redisKey}:${jobId}`);
    return lastIndex ? parseInt(lastIndex, 10) : 0;
  }

  private logError(filePath: string, message: string) {
    fs.appendFileSync(filePath, `${new Date().toISOString()} - ${message}\n`);
  }

  private async cleanUp(filePath: string, errorLogPath: string) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    this.logger.log(`Temporary file ${filePath} deleted successfully.`);

    if (fs.existsSync(errorLogPath)) {
      this.logger.log(`Error log saved at ${errorLogPath}`);
    }
  }
}
