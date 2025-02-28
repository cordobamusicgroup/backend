import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Distributor } from '@prisma/client';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { S3Service } from 'src/common/services/s3.service';
import { AdminUnlinkedReportService } from './admin-unlinked-report.service';
import { UploadCsvDto } from '../../dto/admin-upload-csv.dto';
import * as path from 'path';

/**
 * Service responsible for managing imported financial reports in the system.
 * Provides functionality to upload, delete, cancel, and retrieve imported reports.
 */
@Injectable()
export class AdminImportedReportsService {
  private readonly logger = new Logger(AdminImportedReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unlinkedReportService: AdminUnlinkedReportService,
    @InjectQueue('import-reports') private readonly importReportsQueue: Queue,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Uploads a CSV file to the processing queue.
   *
   * @param uploadCsvDto The DTO containing the CSV file and related data
   * @returns A message indicating the CSV file has been queued for processing
   * @throws BadRequestException if there are validation errors
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

      this.logger.log(
        `CSV file queued for processing: ${distributor} ${reportingMonth}`,
      );
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

  /**
   * Validates that there isn't already a job in progress for the same reporting period
   *
   * @param reportingMonth The reporting month to validate
   * @param distributor The distributor to validate
   * @throws BadRequestException if a job is already in progress
   */
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
   *
   * @param distributor The distributor to check
   * @param reportingMonth The reporting month to check
   * @returns A boolean indicating whether there are existing reports
   * @throws BadRequestException if reporting month is not provided
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

  /**
   * Deletes imported reports for a specific reporting month and distributor.
   * Optionally deletes associated S3 file.
   *
   * @param reportingMonth - The reporting month in YYYYMM format
   * @param distributor - The distributor type (e.g., KONTOR, BELIEVE)
   * @param deleteS3File - Whether to delete the associated S3 file
   * @returns Object containing information about deletion results
   * @throws BadRequestException if report deletion fails
   */
  async deleteImportedReports(
    reportingMonth: string,
    distributor: Distributor,
    deleteS3File: boolean,
  ) {
    const result = {
      deleted: 0,
      retained: 0,
      reasons: [],
    };

    try {
      let deleteResult;
      let retainedCount;

      // Process delete operations based on distributor type
      if (distributor === Distributor.BELIEVE) {
        // Delete Believe royalty reports
        deleteResult = await this.prisma.believeRoyaltyReport.deleteMany({
          where: { reportingMonth },
        });
        result.deleted = deleteResult.count;

        // Count records that were retained due to relationships
        retainedCount = await this.prisma.believeRoyaltyReport.count({
          where: {
            reportingMonth,
            OR: [
              { baseReportId: { not: null } },
              { userReportId: { not: null } },
            ],
          },
        });
      } else if (distributor === Distributor.KONTOR) {
        // Delete Kontor royalty reports
        deleteResult = await this.prisma.kontorRoyaltyReport.deleteMany({
          where: { reportingMonth },
        });
        result.deleted = deleteResult.count;

        // Count records that were retained due to relationships
        retainedCount = await this.prisma.kontorRoyaltyReport.count({
          where: {
            reportingMonth,
            OR: [
              { baseReportId: { not: null } },
              { userReportId: { not: null } },
            ],
          },
        });
      }

      result.retained = retainedCount;

      // Delete unlinked reports
      await this.unlinkedReportService.deleteManyUnlinkedReports(
        distributor,
        reportingMonth,
      );

      // Optionally delete the S3 file
      if (deleteS3File) {
        const importedReport =
          await this.prisma.importedRoyaltyReport.findFirst({
            where: { distributor, reportingMonth },
          });

        if (importedReport && importedReport.s3FileId) {
          try {
            await this.s3Service.deleteFile({ id: importedReport.s3FileId });
          } catch (error) {
            this.logger.warn(
              `S3 file not found for imported report ID: ${importedReport.id}`,
            );
          }
        } else {
          this.logger.warn(
            `Imported report or S3 file not found for ${distributor} ${reportingMonth}`,
          );
        }
      }

      // Finally, delete the ImportedRoyaltyReport record itself
      await this.prisma.importedRoyaltyReport.deleteMany({
        where: { distributor, reportingMonth },
      });

      return {
        message: `Deleted ${result.deleted} reports, retained ${result.retained} reports.`,
      };
    } catch (error) {
      this.logger.error(`Failed to delete imported reports: ${error.message}`);
      throw new BadRequestException('Failed to delete imported reports.');
    }
  }

  /**
   * Cancels ongoing import jobs for a specific reporting month and distributor.
   *
   * @param reportingMonth - The reporting month in YYYYMM format
   * @param distributor - The distributor type (e.g., KONTOR, BELIEVE)
   * @returns Object containing information about cancelled jobs
   */
  async cancelJobs(reportingMonth: string, distributor: Distributor) {
    // Find all active and waiting jobs
    const jobs = await this.importReportsQueue.getJobs(['waiting', 'active']);

    // Filter jobs matching the specified criteria
    const jobsToCancel = jobs.filter(
      (job) =>
        job.data.reportingMonth === reportingMonth &&
        job.data.distributor === distributor,
    );

    // Process each job for cancellation
    for (const job of jobsToCancel) {
      try {
        // Try to remove the job from the queue
        await job.remove();

        // If job is active, move it to failed state
        if (job.isActive) {
          await job.moveToFailed({ message: 'Job cancelled' }, true);
        }

        this.logger.log(`Job ${job.id} cancelled successfully.`);
      } catch (error) {
        this.logger.error(`Failed to cancel job ${job.id}: ${error.message}`);
      }
    }

    return { message: `${jobsToCancel.length} job(s) cancelled.` };
  }

  /**
   * Retrieves imported reports for a specific reporting month and distributor.
   *
   * @param reportingMonth - The reporting month in YYYYMM format
   * @param distributor - The distributor type (e.g., KONTOR, BELIEVE)
   * @returns Array of imported report records
   */
  async getImportedReports(reportingMonth: string, distributor: Distributor) {
    return this.prisma.importedRoyaltyReport.findMany({
      where: { reportingMonth, distributor },
    });
  }

  /**
   * Retrieves all imported reports, optionally filtered by distributor.
   *
   * @param distributor - Optional distributor filter
   * @returns Array of imported report records sorted by reporting month
   */
  async getAllImportedReports(distributor?: Distributor) {
    const filter = distributor ? { distributor } : {};
    return this.prisma.importedRoyaltyReport.findMany({
      where: filter,
      orderBy: { reportingMonth: 'desc' },
    });
  }
}
