import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Distributor } from 'src/generated/client';
import * as path from 'path';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bull';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { UploadCsvDto } from '../../dto/admin-upload-csv.dto';
import { S3Service } from 'src/common/services/s3.service';

@Injectable()
export class AdminReportProcessCSVService {
  private readonly logger = new Logger(AdminReportProcessCSVService.name);

  constructor(
    @InjectQueue('import-reports') private importReportsQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly loggerTxt: LoggerTxtService,
    private readonly s3Service: S3Service,
  ) {}

  // [PUBLIC METHODS]

  /**
   * Uploads a CSV file to the processing queue.
   * @param uploadCsvDto The DTO containing the CSV file and related data.
   * @returns A message indicating the CSV file has been queued for processing.
   */
  async uploadCsvToQueue(uploadCsvDto: UploadCsvDto) {
    const { file, reportingMonth, distributor } = uploadCsvDto;
    const tempFilePath = path.resolve(file.path);

    try {
      // Check if there are existing jobs in progress for the given distributor and reporting month
      await this.validateNoJobInProgress(reportingMonth, distributor);

      // Check if there are existing reports for the given distributor and reporting month
      if (await this.checkForExistingReports(distributor, reportingMonth)) {
        throw new BadRequestException(
          'There are already records for the given distributor and reporting month.',
        );
      }

      // Create an ImportedRoyaltyReport record
      const importedReport = await this.prisma.importedRoyaltyReport.create({
        data: {
          distributor,
          reportingMonth,
          importStatus: 'PENDING',
        },
      });

      // Add the CSV file to the processing queue
      await this.importReportsQueue.add('ImportReportCSV', {
        filePath: tempFilePath,
        reportingMonth,
        distributor,
        importReportId: importedReport.id,
      });

      return {
        message: 'CSV file queued for processing.',
        distributor,
        reportingMonth,
      };
    } catch (error) {
      this.logger.error(`Failed to queue CSV for processing: ${error.message}`);
      throw error;
    }
  }

  async validateNoJobInProgress(
    reportingMonth: string,
    distributor: Distributor,
  ) {
    const existingJobs = await this.importReportsQueue.getJobs([
      'waiting',
      'active',
    ]);
    const isJobInProgress = existingJobs.some(
      (job) =>
        job.data.reportingMonth === reportingMonth &&
        job.data.distributor === distributor,
    );

    if (isJobInProgress) {
      throw new BadRequestException(
        'There is already a job in progress for the same reporting month and distributor.',
      );
    }
  }

  /**
   * Checks if there are existing reports for the given distributor and reporting month.
   * @param distributor The distributor to check.
   * @param reportingMonth The reporting month to check.
   * @returns A boolean indicating whether there are existing reports.
   */
  private async checkForExistingReports(
    distributor: Distributor,
    reportingMonth: string,
  ): Promise<boolean> {
    if (!reportingMonth) {
      throw new BadRequestException('Reporting month must be provided.');
    }

    let existingReport = null;
    if (distributor === Distributor.KONTOR) {
      existingReport = await this.prisma.kontorRoyaltyReport.findFirst({
        where: { reportingMonth },
      });
    } else if (distributor === Distributor.BELIEVE) {
      existingReport = await this.prisma.believeRoyaltyReport.findFirst({
        where: { reportingMonth },
      });
    }
    return !!existingReport;
  }
}
