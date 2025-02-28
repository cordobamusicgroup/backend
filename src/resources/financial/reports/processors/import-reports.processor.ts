import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImportReportDto } from '../dto/admin-import-report.dto';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { ProgressService } from 'src/common/services/progress.service';
import { S3Service } from 'src/common/services/s3.service';
import { AdminReportProcessCSVService } from '../services/admin/admin-report-process-csv.service';
import cleanUp from '../utils/cleanup.util';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import env from 'src/config/env.config';
import { ProcessingType } from '../enums/processing-type.enum';
import { BullJobLogger } from 'src/common/logger/BullJobLogger';

@Processor('import-reports')
export class ImportReportsProcessor extends WorkerHost {
  private readonly logger = new BullJobLogger();
  private readonly redisKey = 'import-reports:progress';

  constructor(
    private readonly reportsService: AdminReportProcessCSVService,
    private readonly progressService: ProgressService,
    private readonly loggerTxt: LoggerTxtService,
    private readonly s3UploadService: S3Service,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<ImportReportDto>): Promise<void> {
    const { filePath, reportingMonth, distributor, importReportId } = job.data;
    const errorLogPath = this.loggerTxt.getLogPath(job.id, 'error');
    const bucket = env.AWS_S3_BUCKET_NAME_ROYALTIES;
    const s3Key = `import-reports/ImportReport_${distributor}_${reportingMonth}.csv`;

    this.logger.log(
      `🚀 Starting processing for file: ${filePath}`,
      job.name,
      job.id,
    );

    try {
      this.logger.log(
        `🔄 Updating import status to ACTIVE...`,
        job.name,
        job.id,
      );
      await this.prisma.importedRoyaltyReport.update({
        where: { id: importReportId },
        data: { importStatus: 'ACTIVE' },
      });

      this.logger.log(`📥 Reading CSV file: ${filePath}`, job.name, job.id);
      const records = await this.reportsService.readCsvFile(
        filePath,
        distributor,
      );

      if (records.length === 0) {
        throw new Error(`❌ No records found in the CSV file.`);
      }

      const lastProcessedIndex =
        await this.progressService.getLastProcessedIndex(this.redisKey, job.id);
      this.logger.log(
        `🔄 Resuming from index: ${lastProcessedIndex}`,
        job.name,
        job.id,
      );

      for (
        let rowIndex = lastProcessedIndex;
        rowIndex < records.length;
        rowIndex++
      ) {
        const record = records[rowIndex];

        this.logger.debug(
          `📌 Processing row: ${rowIndex + 1}`,
          job.name,
          job.id,
        );

        await this.reportsService.processCSVRecord(
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

      this.logger.log(`✅ Processing complete!`, job.name, job.id);

      this.logger.log(`📤 Uploading processed file to S3...`, job.name, job.id);
      const s3File = await this.s3UploadService.uploadFile(
        bucket,
        s3Key,
        filePath,
      );

      this.logger.log(
        `🗄️ Updating DB with S3 file ID: ${s3File.id}`,
        job.name,
        job.id,
      );
      await this.prisma.importedRoyaltyReport.update({
        where: { id: importReportId },
        data: {
          importStatus: 'COMPLETED',
          s3File: { connect: { id: s3File.id } },
        },
      });

      this.logger.log(`🧹 Cleaning up temp files...`, job.name, job.id);
      await cleanUp(filePath, errorLogPath, this.logger);
    } catch (error) {
      this.logger.error(
        `❌ Failed to process: ${error.message}`,
        job.name,
        job.id,
      );
      this.logger.debug(`🛑 Stack Trace: ${error.stack}`, job.name, job.id);

      // Delete Imported Register from DB on failure
      this.logger.warn(
        `⚠️ Deleting import entry due to failure...`,
        job.name,
        job.id,
      );
      await this.prisma.importedRoyaltyReport.delete({
        where: { id: importReportId },
      });
    }
  }
}
