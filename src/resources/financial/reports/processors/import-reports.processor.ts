// src/resources/financial/reports/base-report.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ImportReportDto } from '../dto/import-report.dto';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { ProgressService } from 'src/common/services/progress.service';
import { S3Service } from 'src/common/services/s3.service';
import { ProcessReportsService } from '../services/process-reports.service';
import cleanUp from '../utils/cleanup.util';
import * as fs from 'fs';

@Processor('import-reports')
export class ImportReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportReportsProcessor.name);
  private readonly redisKey = 'import-reports:progress';

  constructor(
    private readonly reportsService: ProcessReportsService,
    private readonly progressService: ProgressService,
    private readonly loggerTxt: LoggerTxtService,
    private readonly s3UploadService: S3Service,
  ) {
    super();
  }

  async process(job: Job<ImportReportDto>): Promise<void> {
    const { filePath, reportingMonth, distributor } = job.data;
    console.log(job.name);
    const errorLogPath = this.loggerTxt.getLogPath(job.id, 'error');
    const bucket = process.env.S3_BUCKET_NAME_ROYALTIES;
    const s3Key = `ImportReport_${distributor}_${reportingMonth}.csv`;

    this.logger.log(
      `[JOB ${job.id}] Starting processing for file: ${filePath}`,
    );

    try {
      const records = await this.reportsService.readCsvFile(
        filePath,
        distributor,
      );
      const lastProcessedIndex =
        await this.progressService.getLastProcessedIndex(this.redisKey, job.id);

      for (let i = lastProcessedIndex; i < records.length; i++) {
        const record = records[i];
        try {
          await this.reportsService.processRecord(
            record,
            distributor,
            reportingMonth,
            i,
            undefined,
            job.id,
          );
        } catch (error) {
          this.logger.error(
            `Error processing record at row ${i}: ${error.message}`,
          );
          await this.loggerTxt.logError(
            `Row ${i}: ${error.message}`,
            job.id,
            'baseReport',
          );
        }
        await this.progressService.saveProgress(this.redisKey, job.id, i + 1);
        this.progressService.calculateAndUpdateProgress(
          job,
          records.length,
          i + 1,
        );
      }

      this.logger.log(`[JOB ${job.id}] Processing complete`);
      await this.s3UploadService.uploadFile(bucket, s3Key, filePath);
      await cleanUp(filePath, errorLogPath, this.logger);

      const errorLogExists = await this.errorLogExists(errorLogPath);
      if (errorLogExists) {
        this.logger.log(`Error log saved at ${errorLogPath}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process base report: ${error.message}`,
        error.stack,
      );
      await this.loggerTxt.logError(
        `General error processing base report: ${error.message}`,
        job.id,
        'baseReport',
      );
    }
  }
  private async errorLogExists(filePath: string): Promise<boolean> {
    const exists = fs.existsSync(filePath);
    return exists;
  }
}
