import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { S3Service } from 'src/common/services/s3.service';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { BullJobLogger } from 'src/common/logger/BullJobLogger';
import { Distributor } from 'generated/client';
import * as fs from 'fs';
import * as path from 'path';
import env from 'src/config/env.config';
import { convertReportsToCsv, ReportType } from '../utils/convert-reports-csv';

// Interface defining the CSV generation job data structure
interface BaseReportJobProps {
  baseReportId: number;
  distributor: Distributor;
  reportingMonth: string;
}

// Union type for all job types this processor can handle
type BaseReportJobData = BaseReportJobProps;

@Processor('base-report')
export class BaseReportProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  /**
   * Main processor method that handles different job types based on job name
   * @param job The job to process
   */
  async process(job: Job<BaseReportJobData>): Promise<void> {
    const logger = new BullJobLogger(job.id, job.name);
    logger.log(`🚀 Starting job: ${job.name}`);

    try {
      switch (job.name) {
        case 'BaseReportGenerateCsv':
          await this.handleGenerateCsv(job as Job<BaseReportJobProps>);
          break;
        default:
          logger.error(`Unknown job type: ${job.name}`);
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      logger.error(`❌ Job failed: ${error.message}`);
      logger.debug(`🛑 Stack Trace: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Handles the generation of CSV files for base reports
   * @param job The CSV generation job
   */
  private async handleGenerateCsv(job: Job<BaseReportJobProps>): Promise<void> {
    const { baseReportId, distributor, reportingMonth } = job.data;
    const logger = new BullJobLogger(job.id, 'generateCsv');

    logger.log(
      `🚀 Starting CSV generation for base report ID: ${baseReportId}`,
    );

    try {
      // Fetch reports data based on distributor
      logger.log(
        `📊 Fetching royalty data for ${distributor} - ${reportingMonth}`,
      );
      const reports = await this.getReports(distributor, reportingMonth);

      if (reports.length === 0) {
        throw new Error('No reports found for CSV generation');
      }
      logger.log(`✅ Found ${reports.length} reports to include in CSV`);

      // Generate CSV content
      logger.log(`🔄 Converting reports to CSV format`);
      const csvData = await convertReportsToCsv(
        reports,
        distributor,
        ReportType.BASE,
      );

      // Create temporary file
      const fileName = `${distributor}_${reportingMonth}_base_report.csv`;
      const directory = path.resolve('temp');
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      const filePath = path.resolve(directory, fileName);

      logger.log(`💾 Writing CSV data to temporary file: ${filePath}`);
      fs.writeFileSync(filePath, csvData);

      // Upload to S3
      const s3Key = `base-reports/${distributor}/${reportingMonth}/${fileName}`;
      logger.log(`📤 Uploading file to S3: ${s3Key}`);
      const s3File = await this.s3Service.uploadFile(
        env.AWS_S3_BUCKET_NAME_ROYALTIES,
        s3Key,
        filePath,
      );

      // Update base report with S3 file reference
      logger.log(`📝 Updating base report with S3 file reference`);
      await this.prisma.baseRoyaltyReport.update({
        where: { id: baseReportId },
        data: {
          s3FileId: s3File.id,
        },
      });

      // Clean up temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.log(`🧹 Temporary file ${filePath} deleted`);
      }

      logger.log(`✅ CSV generation completed successfully`);
    } catch (error) {
      logger.error(`❌ Failed to generate CSV: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetches reports from the appropriate table based on distributor
   * Uses optimized query with only needed fields
   */
  private async getReports(distributor: Distributor, reportingMonth: string) {
    if (distributor === Distributor.KONTOR) {
      return this.prisma.kontorRoyaltyReport.findMany({
        where: { reportingMonth },
      });
    } else if (distributor === Distributor.BELIEVE) {
      return this.prisma.believeRoyaltyReport.findMany({
        where: { reportingMonth },
      });
    }
    return [];
  }
}
