// src/resources/financial/reports/base-report.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ImportReportDto } from '../dto/admin-import-report.dto';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { ProgressService } from 'src/common/services/progress.service';
import { S3Service } from 'src/common/services/s3.service';
import { AdminReportsHelperService } from '../services/admin/admin-reports-helper.service';
import cleanUp from '../utils/cleanup.util';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import env from 'src/config/env.config';
import { ProcessingType } from '../enums/processing-type.enum';
import { doubleLog } from '../utils/logger.util';

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

    await doubleLog(
      'log',
      `[JOB ${job.id}] Starting processing for file: ${filePath}`,
      job.id,
      'ProcessReportRecord',
      this.logger,
      this.loggerTxt,
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
        throw new Error(`[JOB ${job.id}] No records found in the CSV file.`);
      }

      const lastProcessedIndex =
        await this.progressService.getLastProcessedIndex(this.redisKey, job.id);

      for (
        let rowIndex = lastProcessedIndex;
        rowIndex < records.length;
        rowIndex++
      ) {
        const record = records[rowIndex];

        await this.reportsService.processRecord(
          record,
          distributor,
          reportingMonth,
          ProcessingType.IMPORT,
          rowIndex,
          undefined, // Label ID is not needed for import
          job.id,
          importReportId,
        );
        await this.progressService.saveProgress(
          this.redisKey,
          job.id,
          rowIndex + 1,
        );
        this.progressService.calculateAndUpdateProgress(
          job,
          records.length,
          rowIndex + 1,
        );
      }

      await doubleLog(
        'log',
        `[JOB ${job.id}] Processing complete`,
        job.id,
        'ProcessReportRecord',
        this.logger,
        this.loggerTxt,
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
        data: {
          importStatus: 'COMPLETED',
          s3File: { connect: { id: s3File.id } },
        },
      });

      await cleanUp(filePath, errorLogPath, this.logger);
    } catch (error) {
      await doubleLog(
        'error',
        `Failed to process base report: ${error.message}`,
        job.id,
        'ProcessReportRecord',
        this.logger,
        this.loggerTxt,
      );

      // Delete Imported Register from DB on fail
      await this.prisma.importedRoyaltyReport.delete({
        where: { id: importReportId },
      });
    }
  }
}
