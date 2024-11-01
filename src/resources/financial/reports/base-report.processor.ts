// src/resources/financial/reports/base-report.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { RedisService } from 'src/common/services/redis.service';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'fast-csv';
import { Logger } from '@nestjs/common';
import { Distributor } from '@prisma/client';
import { mapCsvToRecord } from 'src/resources/financial/reports/utils/csv-mapper.util';

@Processor('base-report')
export class BaseReportProcessor extends WorkerHost {
  private readonly logger = new Logger(BaseReportProcessor.name);
  private readonly redisKey = 'base-report:progress';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { filePath, reportingMonth, distributor } = job.data;
    const errorLogPath = path.join(
      path.dirname(filePath),
      `error_log_${job.id}.txt`,
    );
    const lastProcessedIndex = await this.getLastProcessedIndex(job.id);

    this.logger.log(
      `[JOB ${job.id}] Starting CSV processing for distributor: ${distributor}`,
    );
    this.logger.log(`[JOB ${job.id}] File path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      this.logger.error(`[JOB ${job.id}] File not found at path: ${filePath}`);
      return;
    }

    const records = await this.readCsvFile(
      filePath,
      distributor,
      reportingMonth,
    );
    if (records.length === 0) {
      this.logger.error(`[JOB ${job.id}] No records to process in CSV file.`);
      return;
    }

    this.logger.log(
      `[JOB ${job.id}] Total records loaded: ${records.length}. Resuming from index ${lastProcessedIndex}.`,
    );

    await this.processRecords(
      records.slice(lastProcessedIndex), // Slice to only process uncompleted rows
      distributor,
      reportingMonth,
      job,
      errorLogPath,
      lastProcessedIndex,
    );

    await this.cleanUp(filePath, errorLogPath);
  }

  private async readCsvFile(
    filePath: string,
    distributor: Distributor,
    reportingMonth: string,
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records = [];
      fs.createReadStream(filePath)
        .pipe(parse({ headers: true, delimiter: ';', ignoreEmpty: true }))
        .on('data', (row) => {
          try {
            const record = mapCsvToRecord(row, distributor);
            if (distributor === Distributor.BELIEVE) {
              record.reportingMonth = record.reportingMonth || reportingMonth;
            }
            records.push(record);
          } catch (error) {
            this.logger.error(`Error mapping row: ${error.message}`);
          }
        })
        .on('end', () => resolve(records))
        .on('error', (error) => reject(error));
    });
  }

  private async processRecords(
    records: any[],
    distributor: Distributor,
    reportingMonth: string,
    job: Job,
    errorLogPath: string,
    initialIndex: number,
  ) {
    for (let i = 0; i < records.length; i++) {
      const recordIndex = initialIndex + i + 1;
      try {
        if (distributor === Distributor.KONTOR) {
          await this.prisma.kontorRoyaltyReport.create({
            data: {
              ...records[i],
              reportingMonth,
              currency: 'EUR',
            },
          });
        } else if (distributor === Distributor.BELIEVE) {
          await this.prisma.believeRoyaltyReport.create({
            data: {
              ...records[i],
              currency: 'USD',
            },
          });
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
