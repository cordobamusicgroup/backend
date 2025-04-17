import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Distributor } from 'generated/client';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { S3Service } from 'src/common/services/s3.service';
import { AdminUnlinkedReportService } from './admin-unlinked-report.service';
import { UploadCsvDto } from '../../dto/admin-upload-csv.dto';
import * as path from 'path';
import { ImportedReportDto } from '../../dto/admin-get-imported-reports.dto';

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
      this.logger.log(
        `🔍 Validating upload for ${distributor} ${reportingMonth}...`,
      );
      // Check if there are existing jobs in progress for the given distributor and reporting month
      await this.validateNoJobInProgress(reportingMonth, distributor);

      // Check if there are existing reports for the given distributor and reporting month
      if (await this.checkForExistingReports(distributor, reportingMonth)) {
        this.logger.warn(
          `⚠️ Found existing reports for ${distributor} ${reportingMonth}`,
        );
        throw new BadRequestException(
          'There are already records for the given distributor and reporting month.',
        );
      }

      // Create an ImportedRoyaltyReport record
      this.logger.log(
        `📝 Creating imported report record for ${distributor} ${reportingMonth}...`,
      );
      const importedReport = await this.prisma.importedRoyaltyReport.create({
        data: {
          distributor,
          reportingMonth,
          importStatus: 'PENDING',
        },
      });

      // Add the CSV file to the processing queue
      this.logger.log(
        `📥 Adding file to import queue for ${distributor} ${reportingMonth}...`,
      );
      await this.importReportsQueue.add('ImportReportCSV', {
        filePath: tempFilePath,
        reportingMonth,
        distributor,
        importReportId: importedReport.id,
      });

      this.logger.log(
        `✅ CSV file queued for processing: ${distributor} ${reportingMonth}`,
      );
      return {
        message: 'CSV file queued for processing.',
        distributor,
        reportingMonth,
      };
    } catch (error) {
      this.logger.error(
        `❌ Failed to queue CSV for processing: ${error.message}`,
      );
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
   * Will not delete reports that have associated base or user reports.
   * Also deletes any associated failed report details.
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
      failedRecordsDeleted: 0,
      reasons: [] as string[],
    };

    try {
      this.logger.log(
        `🔍 Checking for imported reports to delete: ${distributor} ${reportingMonth}...`,
      );
      // First, determine if there are associated base or user reports
      const importedReport = await this.prisma.importedRoyaltyReport.findFirst({
        where: { distributor, reportingMonth },
      });

      if (!importedReport) {
        this.logger.warn(
          `⚠️ No imported reports found for ${distributor} ${reportingMonth}`,
        );
        return {
          message: 'No imported reports found for the specified criteria.',
        };
      }

      // Check for related reports based on distributor
      this.logger.log(
        `🔎 Checking for associated reports for ${distributor} ${reportingMonth}...`,
      );
      let hasRelatedReports = false;

      if (distributor === Distributor.BELIEVE) {
        const relatedReportsCount =
          await this.prisma.believeRoyaltyReport.count({
            where: {
              reportingMonth,
              OR: [
                { baseReportId: { not: null } },
                { userReportId: { not: null } },
              ],
            },
          });

        if (relatedReportsCount > 0) {
          hasRelatedReports = true;
          const reason = `Found ${relatedReportsCount} Believe reports with base or user report associations.`;
          result.reasons.push(reason);
          this.logger.warn(`🔗 ${reason}`);
        }
      } else if (distributor === Distributor.KONTOR) {
        const relatedReportsCount = await this.prisma.kontorRoyaltyReport.count(
          {
            where: {
              reportingMonth,
              OR: [
                { baseReportId: { not: null } },
                { userReportId: { not: null } },
              ],
            },
          },
        );

        if (relatedReportsCount > 0) {
          hasRelatedReports = true;
          const reason = `Found ${relatedReportsCount} Kontor reports with base or user report associations.`;
          result.reasons.push(reason);
          this.logger.warn(`🔗 ${reason}`);
        }
      }

      // If there are related reports, don't proceed with deletion
      if (hasRelatedReports) {
        this.logger.warn(
          `❌ Cannot delete imported reports for ${distributor} ${reportingMonth} - found associated base or user reports`,
        );
        return {
          message:
            'Cannot delete imported reports with associated base or user reports.',
          details: result.reasons,
        };
      }

      // If no related reports, proceed with deletion
      this.logger.log(
        `🗑️ Proceeding with deletion for ${distributor} ${reportingMonth}...`,
      );
      let deleteResult;

      // Process delete operations based on distributor type
      if (distributor === Distributor.BELIEVE) {
        // Delete Believe royalty reports
        deleteResult = await this.prisma.believeRoyaltyReport.deleteMany({
          where: {
            reportingMonth,
            baseReportId: null,
            userReportId: null,
          },
        });
        result.deleted = deleteResult.count;
        this.logger.log(`🗑️ Deleted ${result.deleted} Believe royalty reports`);
      } else if (distributor === Distributor.KONTOR) {
        // Delete Kontor royalty reports
        deleteResult = await this.prisma.kontorRoyaltyReport.deleteMany({
          where: {
            reportingMonth,
            baseReportId: null,
            userReportId: null,
          },
        });
        result.deleted = deleteResult.count;
        this.logger.log(`🗑️ Deleted ${result.deleted} Kontor royalty reports`);
      }

      // Delete unlinked reports
      this.logger.log(
        `🗑️ Deleting unlinked reports for ${distributor} ${reportingMonth}...`,
      );
      await this.unlinkedReportService.deleteManyUnlinkedReports(
        distributor,
        reportingMonth,
      );

      // Delete any failed report details for this period
      this.logger.log(
        `🗑️ Deleting failed report details for ${distributor} ${reportingMonth}...`,
      );
      const failedReportDeleteResult =
        await this.prisma.failedReportDetail.deleteMany({
          where: { distributor, reportingMonth },
        });

      result.failedRecordsDeleted = failedReportDeleteResult.count;
      this.logger.log(
        `🗑️ Deleted ${result.failedRecordsDeleted} failed report details`,
      );

      // Optionally delete the S3 file
      if (deleteS3File && importedReport.s3FileId) {
        try {
          this.logger.log(
            `🗑️ Deleting S3 file for imported report ID: ${importedReport.id}...`,
          );
          await this.s3Service.deleteFile({ id: importedReport.s3FileId });
          this.logger.log(
            `✅ Deleted S3 file for imported report ID: ${importedReport.id}`,
          );
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to delete S3 file for imported report ID: ${importedReport.id} - ${error.message}`,
          );
          result.reasons.push(`S3 file deletion failed: ${error.message}`);
        }
      }

      // Finally, delete the ImportedRoyaltyReport record itself
      this.logger.log(
        `🗑️ Deleting imported royalty report record for ${distributor} ${reportingMonth}...`,
      );
      await this.prisma.importedRoyaltyReport.deleteMany({
        where: { distributor, reportingMonth },
      });
      this.logger.log(
        `✅ Completed deletion process for ${distributor} ${reportingMonth}`,
      );

      return {
        message: `Successfully deleted ${result.deleted} reports with no associations and ${result.failedRecordsDeleted} failed report details.`,
        details: {
          deleted: result.deleted,
          failedRecordsDeleted: result.failedRecordsDeleted,
          retained: result.retained,
          reasons: result.reasons,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Failed to delete imported reports: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to delete imported reports: ${error.message}`,
      );
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
    this.logger.log(
      `🔍 Looking for jobs to cancel for ${distributor} ${reportingMonth}...`,
    );
    // Find all active and waiting jobs
    const jobs = await this.importReportsQueue.getJobs(['waiting', 'active']);

    // Filter jobs matching the specified criteria
    const jobsToCancel = jobs.filter(
      (job) =>
        job.data.reportingMonth === reportingMonth &&
        job.data.distributor === distributor,
    );

    if (jobsToCancel.length === 0) {
      this.logger.log(
        `ℹ️ No jobs found to cancel for ${distributor} ${reportingMonth}`,
      );
      return { message: 'No jobs found to cancel.' };
    }

    this.logger.log(
      `🚫 Found ${jobsToCancel.length} job(s) to cancel for ${distributor} ${reportingMonth}`,
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

        this.logger.log(`✅ Job ${job.id} cancelled successfully.`);
      } catch (error) {
        this.logger.error(
          `❌ Failed to cancel job ${job.id}: ${error.message}`,
        );
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
    this.logger.log(
      `🔍 Fetching imported reports for ${distributor} ${reportingMonth}...`,
    );
    const reports = await this.prisma.importedRoyaltyReport.findMany({
      where: { reportingMonth, distributor },
    });
    this.logger.log(
      `📋 Found ${reports.length} imported reports for ${distributor} ${reportingMonth}`,
    );
    return reports;
  }

  /**
   * Retrieves all imported reports, optionally filtered by distributor.
   *
   * @param distributor - Optional distributor filter
   * @returns Array of imported report records sorted by reporting month
   */
  async getAllImportedReports(
    distributor?: Distributor,
  ): Promise<ImportedReportDto[]> {
    const distributorInfo = distributor
      ? `for ${distributor}`
      : 'for all distributors';
    this.logger.log(`🔍 Fetching all imported reports ${distributorInfo}...`);
    const filter = distributor ? { distributor } : {};
    const reports = await this.prisma.importedRoyaltyReport.findMany({
      where: filter,
      orderBy: { reportingMonth: 'desc' },
    });
    this.logger.log(
      `📋 Found ${reports.length} imported reports ${distributorInfo}`,
    );
    return await Promise.all(
      reports.map(async (report) => this.convertToDto(report)),
    );
  }

  /**
   * Converts an imported report entity to a DTO with a signed URL
   */
  private async convertToDto(report: any): Promise<ImportedReportDto> {
    let url;
    if (report.s3FileId) {
      try {
        const s3File = await this.s3Service.getFile({
          id: report.s3FileId,
        });
        url = s3File.url;
      } catch (error) {
        this.logger.error(
          `Failed to retrieve signed URL for S3 file ID: ${report.s3FileId}: ${error.message}`,
        );
        url = undefined;
      }
    }

    return {
      id: report.id,
      reportingMonth: report.reportingMonth,
      distributor: report.distributor,
      status: report.status,
      url: url,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}
