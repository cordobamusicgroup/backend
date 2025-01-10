// src/resources/financial/reports/base-report.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ImportReportDto } from '../dto/admin-import-report.dto';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { ProgressService } from 'src/common/services/progress.service';
import { S3Service } from 'src/common/services/s3.service';
import { AdminReportsHelperService } from '../services/admin-reports-helper.service';
import cleanUp from '../utils/cleanup.util';
import * as fs from 'fs';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import env from 'src/config/env.config';

@Processor('import-reports')
export class ImportReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportReportsProcessor.name);
  private readonly redisKey = 'import-reports:progress';

  constructor(
    private readonly reportsService: AdminReportsHelperService,
    private readonly progressService: ProgressService,
    private readonly loggerTxt: LoggerTxtService,
    private readonly s3UploadService: S3Service,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<ImportReportDto>): Promise<void> {
    const { filePath, reportingMonth, distributor, importReportId } = job.data;
    console.log(job.name);
    const errorLogPath = this.loggerTxt.getLogPath(job.id, 'error');
    const bucket = env.AWS_S3_BUCKET_NAME_ROYALTIES;
    const s3Key = `import-reports/ImportReport_${distributor}_${reportingMonth}.csv`;

    await this.doubleLog(
      'log',
      `[JOB ${job.id}] Starting processing for file: ${filePath}`,
      job.id,
      'baseReport',
    );

    try {
      // Update import status to ACTIVE
      await this.prisma.importedRoyaltyReport.update({
        where: { id: importReportId },
        data: { importStatus: 'ACTIVE' },
      });

      const records = await this.reportsService.readCsvFile(
        filePath,
        distributor,
      );

      if (records.length === 0) {
        await this.doubleLog(
          'warn',
          `[JOB ${job.id}] No records found in the CSV file.`,
          job.id,
          'baseReport',
        );
        return;
      }

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
            importReportId, // Pass importReportId
          );
        } catch (error) {
          await this.doubleLog(
            'error',
            `Error processing record at row ${i}: ${error.message}`,
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

      await this.doubleLog(
        'log',
        `[JOB ${job.id}] Processing complete`,
        job.id,
        'baseReport',
      );

      // Upload the file to S3
      const s3File = await this.s3UploadService.uploadFile(
        bucket,
        s3Key,
        filePath,
      );

      // Update the ImportedRoyaltyReport record with the S3 file ID
      await this.prisma.importedRoyaltyReport.update({
        where: { id: importReportId },
        data: { importStatus: 'COMPLETED', s3FileId: s3File.id },
      });

      await cleanUp(filePath, errorLogPath, this.logger);

      const errorLogExists = await this.errorLogExists(errorLogPath);
      if (errorLogExists) {
        await this.doubleLog(
          'log',
          `Error log saved at ${errorLogPath}`,
          job.id,
          'baseReport',
        );
      }
    } catch (error) {
      await this.doubleLog(
        'error',
        `Failed to process base report: ${error.message}`,
        job.id,
        'baseReport',
      );

      // Update import status to FAILED
      await this.prisma.importedRoyaltyReport.update({
        where: { id: importReportId },
        data: { importStatus: 'FAILED' },
      });
    }
  }

  private async errorLogExists(filePath: string): Promise<boolean> {
    const exists = fs.existsSync(filePath);
    return exists;
  }

  private async doubleLog(
    level: 'log' | 'error' | 'warn',
    message: string,
    jobId: string,
    context: string,
  ): Promise<void> {
    this.logger[level](message);
    switch (level) {
      case 'log':
        await this.loggerTxt.logInfo(message, jobId, context);
        break;
      case 'warn':
        await this.loggerTxt.logWarn(message, jobId, context);
        break;
      case 'error':
        await this.loggerTxt.logError(message, jobId, context);
        break;
    }
  }
}
