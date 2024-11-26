// src/resources/financial/reports/link-unlinked.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ProgressService } from 'src/common/services/progress.service';
import { ProcessReportsService } from '../services/process-reports.service';
import * as fs from 'fs';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { LinkUnlinkedReportDto } from '../dto/link-unlinked-report.dto';
import { UnlinkedReportService } from '../services/unlinked-report.service';

@Processor('link-unlinked-reports')
export class LinkUnlinkedProcessor extends WorkerHost {
  private readonly logger = new Logger(LinkUnlinkedProcessor.name);
  private readonly redisKey = 'link-unlinked:progress';

  constructor(
    private readonly reportsService: ProcessReportsService,
    private readonly progressService: ProgressService,
    private readonly loggerTxt: LoggerTxtService,
    private readonly unlinkedReportService: UnlinkedReportService,
  ) {
    super();
  }

  async process(job: Job<LinkUnlinkedReportDto>): Promise<void> {
    const { unlinkedReportId, labelId } = job.data;
    const errorLogPath = this.loggerTxt.getLogPath(job.id, 'error');

    this.logger.log(
      `[JOB ${job.id}] Starting linking process for UnlinkedReport ID: ${unlinkedReportId}`,
    );

    const unlinkedReport =
      await this.unlinkedReportService.getUnlinkedRecords(unlinkedReportId);
    if (!unlinkedReport) {
      throw new Error(`UnlinkedReport with ID ${unlinkedReportId} not found.`);
    }

    const { distributor, reportingMonth, UnlinkedReportDetail } =
      unlinkedReport;
    const lastProcessedIndex = await this.progressService.getLastProcessedIndex(
      this.redisKey,
      job.id,
    );

    for (let i = lastProcessedIndex; i < UnlinkedReportDetail.length; i++) {
      const record_detail = UnlinkedReportDetail[i];
      const records_detailData = record_detail.data as Record<string, any>;

      try {
        await this.reportsService.processRecord(
          records_detailData,
          distributor,
          reportingMonth,
          i,
          labelId,
          job.id,
        );
      } catch (error) {
        await this.loggerTxt.logError(
          `Row ${i}: ${error.message}`,
          job.id,
          'linkUnlinkedReports',
        );
      }
      await this.progressService.saveProgress(this.redisKey, job.id, i + 1);
      this.progressService.calculateAndUpdateProgress(
        job,
        UnlinkedReportDetail.length,
        i + 1,
      );
    }

    this.logger.log(`[JOB ${job.id}] Linking complete`);
    const errorLogExists = await this.errorLogExists(errorLogPath);
    if (!errorLogExists) {
      await this.unlinkedReportService.deleteUnlinkedReport(unlinkedReportId);
      this.logger.log(
        `UnlinkedReport ID ${unlinkedReportId} deleted after successful processing.`,
      );
    }
  }

  private async errorLogExists(filePath: string): Promise<boolean> {
    const exists = fs.existsSync(filePath);
    return exists;
  }
}
