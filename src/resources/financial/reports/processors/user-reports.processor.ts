// src/resources/financial/reports/base-report.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ProgressService } from 'src/common/services/progress.service';
import { Distributor } from 'generated/client';
import { UserRoyaltyReportsAlreadyExistException } from 'src/common/exceptions/CustomHttpException';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { S3Service } from 'src/common/services/s3.service';
import * as fs from 'fs';
import { convertReportsToCsv, ReportType } from '../utils/convert-reports-csv';
import Decimal from 'decimal.js';
import env from 'src/config/env.config';
import { BullJobLogger } from 'src/common/logger/BullJobLogger';
import * as path from 'path';

/**
 * Processor for handling user royalty reports operations
 *
 * This processor manages four main operations:
 * - GenerateUserReports: Creates user royalty reports from base reports and automatically exports them
 * - ExportUserReports: Exports user royalty reports to CSV files and uploads to S3
 * - DeleteUserReports: Deletes both user royalty reports and their associated CSV files
 * - DeleteExportedUserReports: Deletes only the exported CSV files, keeping the reports
 */
@Processor('user-reports')
export class UserReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(UserReportsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly s3UploadService: S3Service,
  ) {
    super();
  }

  /**
   * Main processor method that handles different job types
   *
   * @param job - The job to be processed
   * @returns Result of the processed job
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const jobLogger = new BullJobLogger(job.id, job.name);
    jobLogger.log(`🚀 Starting job processing: ${job.name}`);

    this.logger.log(
      `[JobId: ${job.id}] Received ${job.name} job for processing`,
    );

    try {
      let result;
      switch (job.name) {
        case 'GenerateUserReports':
          this.logger.log(
            `Processing GenerateUserReports job for distributor: ${job.data.distributor}, month: ${job.data.reportingMonth}`,
          );
          // Generate reports
          result = await this.generateUserRoyaltyReports(
            job.data.distributor,
            job.data.reportingMonth,
            job.id,
          );

          // After generating reports, immediately export them to CSV
          jobLogger.log(`Automatically starting CSV export after generation`);
          await this.exportUserReports(
            job.data.distributor,
            job.data.reportingMonth,
            job.id,
          );

          this.logger.log(
            `Successfully completed GenerateUserReports with CSV export for distributor: ${job.data.distributor}, month: ${job.data.reportingMonth}`,
          );
          return result;

        case 'ExportUserReports':
          this.logger.log(
            `Processing ExportUserReports job for distributor: ${job.data.distributor}, month: ${job.data.reportingMonth}`,
          );
          result = await this.exportUserReports(
            job.data.distributor,
            job.data.reportingMonth,
            job.id,
          );
          this.logger.log(
            `Successfully completed ExportUserReports for distributor: ${job.data.distributor}, month: ${job.data.reportingMonth}`,
          );
          return result;

        case 'DeleteUserReports':
          this.logger.log(
            `Processing DeleteUserReports job for distributor: ${job.data.distributor}, month: ${job.data.reportingMonth}`,
          );
          result = await this.deleteUserRoyaltyReports(
            job.data.distributor,
            job.data.reportingMonth,
            job.id,
          );
          this.logger.log(
            `Successfully completed DeleteUserReports for distributor: ${job.data.distributor}, month: ${job.data.reportingMonth}`,
          );
          return result;

        case 'DeleteExportedUserReports':
          this.logger.log(
            `Processing DeleteExportedUserReports job for distributor: ${job.data.distributor}, month: ${job.data.reportingMonth}`,
          );
          result = await this.deleteExportedUserReports(
            job.data.distributor,
            job.data.reportingMonth,
            job.id,
          );
          this.logger.log(
            `Successfully completed DeleteExportedUserReports for distributor: ${job.data.distributor}, month: ${job.data.reportingMonth}`,
          );
          return result;

        default:
          jobLogger.error(`Unknown job name: ${job.name}`);
          this.logger.error(`[JobId: ${job.id}] Unknown job name: ${job.name}`);
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      jobLogger.error(`Error processing job ${job.name}: ${error.message}`);
      jobLogger.debug(`Stack trace: ${error.stack}`);
      this.logger.error(
        `[JobId: ${job.id}] Error processing ${job.name}: ${error.message}`,
      );
      this.logger.debug(`[JobId: ${job.id}] Stack trace: ${error.stack}`);
      throw error;
    } finally {
      jobLogger.log(`🏁 Job processing completed: ${job.name}`);
      this.logger.log(`[JobId: ${job.id}] Job ${job.name} processing finished`);
    }
  }

  /**
   * Generates user royalty reports from base reports for a specific distributor and month
   *
   * @param distributor - The distributor source (KONTOR, BELIEVE)
   * @param reportingMonth - The reporting month in YYYY-MM format
   * @param jobId - ID of the job for logging
   * @returns Object with success message
   */
  async generateUserRoyaltyReports(
    distributor: Distributor,
    reportingMonth: string,
    jobId?: string,
  ) {
    const jobLogger = new BullJobLogger(jobId, 'GenerateUserReports');

    try {
      jobLogger.log(
        `🚀 Starting generation of user royalty reports for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      this.logger.log(
        `Starting user royalty reports generation for ${distributor}/${reportingMonth}`,
      );

      // Find base report
      this.logger.log(
        `Finding base report for ${distributor}/${reportingMonth}`,
      );
      const baseReport = await this.findBaseReport(
        distributor,
        reportingMonth,
        jobLogger,
      );
      this.logger.log(`Found base report ID: ${baseReport.id}`);

      // Check for existing reports
      this.logger.log(
        `Checking for existing user reports for base report ID: ${baseReport.id}`,
      );
      await this.checkForExistingReports(baseReport.id, jobLogger);
      this.logger.log(
        `No existing user reports found for base report ID: ${baseReport.id}`,
      );

      // Determine unique client IDs from reports
      const clientIds = this.extractUniqueClientIds(baseReport);
      if (clientIds.size === 0) {
        const errorMessage = 'No reports found to determine client';
        jobLogger.error(errorMessage);
        this.logger.error(errorMessage);
        throw new Error('No reports found to determine client');
      }

      jobLogger.log(
        `📊 Client IDs determined: ${Array.from(clientIds).join(', ')}`,
      );
      this.logger.log(`Found ${clientIds.size} unique clients for processing`);

      // Generate user reports for each client
      this.logger.log(`Creating user reports for ${clientIds.size} clients...`);
      await this.createUserReportsForClients(baseReport, clientIds, jobLogger);
      this.logger.log(`User reports created successfully for all clients`);

      // Verify that all records were assigned to user reports
      this.logger.log(`Verifying report coverage...`);
      await this.verifyReportCoverage(baseReport, jobLogger);

      jobLogger.log(
        `✅ User royalty reports generated successfully for baseReportId: ${baseReport.id}`,
      );
      this.logger.log(
        `✅ User royalty reports generation completed for ${distributor}/${reportingMonth}`,
      );

      return {
        success: true,
        message: 'User royalty reports generated successfully.',
        baseReportId: baseReport.id,
        clientCount: clientIds.size,
      };
    } catch (error) {
      jobLogger.error(
        `Failed to generate user royalty reports: ${error.message}`,
      );
      this.logger.error(
        `Failed to generate user royalty reports for ${distributor}/${reportingMonth}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Finds the base report for a given distributor and reporting month
   *
   * @param distributor - The distributor source
   * @param reportingMonth - The reporting month
   * @param logger - Logger for the operation
   * @returns The base report with related data
   * @throws Error if base report not found
   */
  private async findBaseReport(
    distributor: Distributor,
    reportingMonth: string,
    logger: BullJobLogger,
  ) {
    logger.log(`🔍 Finding base report for ${distributor} / ${reportingMonth}`);

    try {
      const baseReport = await this.prisma.baseRoyaltyReport.findFirst({
        where: { distributor, reportingMonth },
        include: {
          kontorReports: { include: { label: { include: { client: true } } } },
          believeReports: { include: { label: { include: { client: true } } } },
        },
      });

      if (!baseReport) {
        const errorMessage = `Base report not found for distributor: ${distributor}, reportingMonth: ${reportingMonth}`;
        logger.error(errorMessage);
        this.logger.error(errorMessage);
        throw new Error('Base report not found');
      }

      logger.log(`✅ Found base report ID: ${baseReport.id}`);
      return baseReport;
    } catch (error) {
      logger.error(`Error finding base report: ${error.message}`);
      this.logger.error(
        `Error finding base report for ${distributor}/${reportingMonth}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Checks if user reports already exist for the given base report
   *
   * @param baseReportId - The base report ID to check
   * @param logger - Logger for the operation
   * @throws UserRoyaltyReportsAlreadyExistException if reports already exist
   */
  private async checkForExistingReports(
    baseReportId: number,
    logger: BullJobLogger,
  ) {
    logger.log(
      `🔍 Checking for existing reports for baseReportId: ${baseReportId}`,
    );

    try {
      const existingReports = await this.prisma.userRoyaltyReport.findMany({
        where: { baseReportId },
      });

      if (existingReports.length > 0) {
        logger.warn(
          `User royalty reports already exist (${existingReports.length} found)`,
        );
        throw new UserRoyaltyReportsAlreadyExistException(baseReportId);
      }

      logger.log(`✅ No existing reports found, proceeding with generation`);
    } catch (error) {
      if (error instanceof UserRoyaltyReportsAlreadyExistException) {
        throw error;
      }
      logger.error(`Error checking for existing reports: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extracts unique client IDs from a base report's associated records
   *
   * @param baseReport - The base report with related kontor and believe reports
   * @returns Set of unique client IDs
   */
  private extractUniqueClientIds(baseReport: any): Set<number> {
    const clientIds = new Set<number>();

    // Extract client IDs from KONTOR reports
    if (baseReport.kontorReports && baseReport.kontorReports.length > 0) {
      baseReport.kontorReports.forEach((report) => {
        if (report.label?.client?.id) {
          clientIds.add(report.label.client.id);
        }
      });
    }

    // Extract client IDs from BELIEVE reports
    if (baseReport.believeReports && baseReport.believeReports.length > 0) {
      baseReport.believeReports.forEach((report) => {
        if (report.label?.client?.id) {
          clientIds.add(report.label.client.id);
        }
      });
    }

    return clientIds;
  }

  /**
   * Creates user royalty reports for each client based on the base report
   *
   * @param baseReport - The base report containing royalty data
   * @param clientIds - Set of client IDs to generate reports for
   * @param logger - Logger for tracing the process
   * @returns Array of created user reports
   */
  private async createUserReportsForClients(
    baseReport: any,
    clientIds: Set<number>,
    logger: BullJobLogger,
  ) {
    const userReportsData = [];
    logger.log(`🔄 Creating user reports for ${clientIds.size} clients`);

    for (const clientId of clientIds) {
      try {
        // Calculate total royalties for this client
        const totalRoyalties = this.calculateTotalRoyalties(
          baseReport,
          clientId,
        );

        // Create user report record
        logger.log(
          `💾 Creating user report for client ID ${clientId} with total royalties: ${totalRoyalties}`,
        );

        const userReport = await this.prisma.userRoyaltyReport.create({
          data: {
            distributor: baseReport.distributor,
            currency: baseReport.currency,
            reportingMonth: baseReport.reportingMonth,
            totalRoyalties: totalRoyalties.toNumber(),
            baseReportId: baseReport.id,
            clientId: clientId,
          },
        });

        // Link royalty records to the user report
        await this.linkRoyaltyReportsToUserReport(
          baseReport.distributor,
          baseReport.reportingMonth,
          clientId,
          userReport.id,
          logger,
        );

        userReportsData.push(userReport);
        logger.log(
          `✅ Created user report ID: ${userReport.id} for client ID: ${clientId}`,
        );
      } catch (error) {
        logger.error(
          `Failed to create user report for client ${clientId}: ${error.message}`,
        );
        // Continue with other clients even if one fails
      }
    }

    logger.log(
      `✅ Created ${userReportsData.length} user reports successfully`,
    );
    return userReportsData;
  }

  /**
   * Calculates total royalties for a specific client from a base report
   *
   * @param baseReport - The base report with royalty data
   * @param clientId - The client ID to calculate for
   * @returns Decimal total of royalties
   */
  private calculateTotalRoyalties(baseReport: any, clientId: number): Decimal {
    let totalRoyalties = new Decimal(0);

    if (
      baseReport.distributor === Distributor.KONTOR &&
      baseReport.kontorReports
    ) {
      const filteredReports = baseReport.kontorReports.filter(
        (report) => report.label?.client?.id === clientId,
      );

      totalRoyalties = filteredReports.reduce((sum, report) => {
        // Ensure we have a valid number
        const revenue = report.cmg_netRevenue
          ? new Decimal(report.cmg_netRevenue)
          : new Decimal(0);
        return sum.plus(revenue);
      }, new Decimal(0));
    }

    if (
      baseReport.distributor === Distributor.BELIEVE &&
      baseReport.believeReports
    ) {
      const filteredReports = baseReport.believeReports.filter(
        (report) => report.label?.client?.id === clientId,
      );

      totalRoyalties = filteredReports.reduce((sum, report) => {
        // Ensure we have a valid number
        const revenue = report.cmg_netRevenue
          ? new Decimal(report.cmg_netRevenue)
          : new Decimal(0);
        return sum.plus(revenue);
      }, new Decimal(0));
    }

    return totalRoyalties;
  }

  /**
   * Links royalty reports to a user report
   *
   * @param distributor - The distributor source
   * @param reportingMonth - The reporting month
   * @param clientId - The client ID
   * @param userReportId - The user report ID to link to
   * @param logger - Logger for tracing the process
   */
  private async linkRoyaltyReportsToUserReport(
    distributor: Distributor,
    reportingMonth: string,
    clientId: number,
    userReportId: number,
    logger: BullJobLogger,
  ) {
    logger.log(`🔗 Linking royalty reports to user report ID: ${userReportId}`);
    let updatedCount = 0;

    try {
      if (distributor === Distributor.KONTOR) {
        const result = await this.prisma.kontorRoyaltyReport.updateMany({
          where: {
            reportingMonth,
            label: { clientId },
          },
          data: { userReportId },
        });
        updatedCount = result.count;
      }

      if (distributor === Distributor.BELIEVE) {
        const result = await this.prisma.believeRoyaltyReport.updateMany({
          where: {
            reportingMonth,
            label: { clientId },
          },
          data: { userReportId },
        });
        updatedCount = result.count;
      }

      logger.log(
        `✅ Linked ${updatedCount} royalty reports to user report ID: ${userReportId}`,
      );
    } catch (error) {
      logger.error(`Failed to link reports to user report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifies that all records from the base report were assigned to user reports
   *
   * @param baseReport - The base report with royalty data
   * @param logger - Logger for tracing the process
   */
  private async verifyReportCoverage(baseReport: any, logger: BullJobLogger) {
    logger.log(`🔍 Verifying all records were assigned to user reports`);

    try {
      let unassignedRecords = 0;
      let unassignedSample = [];

      if (baseReport.distributor === Distributor.KONTOR) {
        // Query database directly to find unassigned records
        const unassigned = await this.prisma.kontorRoyaltyReport.findMany({
          where: {
            baseReportId: baseReport.id,
            userReportId: null,
          },
          include: {
            label: {
              include: { client: true },
            },
          },
          take: 10, // Limit sample size
        });

        // Get total count separately for efficiency
        const totalUnassigned = await this.prisma.kontorRoyaltyReport.count({
          where: {
            baseReportId: baseReport.id,
            userReportId: null,
          },
        });

        unassignedRecords = totalUnassigned;
        unassignedSample = unassigned;
      } else if (baseReport.distributor === Distributor.BELIEVE) {
        // Query database directly to find unassigned records
        const unassigned = await this.prisma.believeRoyaltyReport.findMany({
          where: {
            baseReportId: baseReport.id,
            userReportId: null,
          },
          include: {
            label: {
              include: { client: true },
            },
          },
          take: 10, // Limit sample size
        });

        // Get total count separately for efficiency
        const totalUnassigned = await this.prisma.believeRoyaltyReport.count({
          where: {
            baseReportId: baseReport.id,
            userReportId: null,
          },
        });

        unassignedRecords = totalUnassigned;
        unassignedSample = unassigned;
      }

      // Log summary
      if (unassignedRecords > 0) {
        logger.warn(
          `Found ${unassignedRecords} records not assigned to any user report`,
        );

        // Log sample of unassigned records with detailed information
        unassignedSample.forEach((record) => {
          const reason = this.determineUnassignedReason(record);
          const identifier = record.ean || record.upc || 'N/A';
          logger.warn(
            `Unassigned record ID: ${record.id}, Identifier: ${identifier}, Title: ${record.title || 'N/A'}, Reason: ${reason}`,
          );
        });

        if (unassignedRecords > unassignedSample.length) {
          logger.warn(
            `... and ${unassignedRecords - unassignedSample.length} more unassigned records`,
          );
        }
      } else {
        logger.log(`✅ All records were successfully assigned to user reports`);
      }
    } catch (error) {
      logger.error(`Error verifying report coverage: ${error.message}`);
    }
  }

  /**
   * Determines the reason why a record was not assigned to a user report
   *
   * @param record - The royalty record
   * @returns String explanation of why the record wasn't assigned
   */
  private determineUnassignedReason(record: any): string {
    if (!record.label) {
      return 'No label information found';
    }

    if (!record.label.client) {
      return `No client associated with label ID: ${record.label.id}`;
    }

    if (!record.label.clientId) {
      return `No client ID defined for label ID: ${record.label.id}`;
    }

    // Check if the label's client actually exists
    if (record.label.clientId && !record.label.client.id) {
      return `Client ID ${record.label.clientId} referenced by label ${record.label.id} doesn't exist`;
    }

    // Add additional checks for any other potential issues
    if (record.label.client && record.label.client.isActive === false) {
      return `Client ${record.label.client.id} is inactive`;
    }

    return 'Unknown reason - possible data inconsistency';
  }

  /**
   * Exports user reports to CSV and uploads them to S3
   *
   * @param distributor - The distributor source
   * @param reportingMonth - The reporting month in YYYY-MM format
   * @param jobId - ID of the job for logging
   * @returns Object with success message
   */
  async exportUserReports(
    distributor: Distributor,
    reportingMonth: string,
    jobId?: string,
  ) {
    const jobLogger = new BullJobLogger(jobId, 'ExportUserReports');

    try {
      jobLogger.log(
        `🚀 Starting export of user royalty reports for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      this.logger.log(
        `Starting user reports export for ${distributor}/${reportingMonth}`,
      );

      // Find base report
      jobLogger.log(`🔍 Finding base report`);
      this.logger.log(
        `Finding base report for ${distributor}/${reportingMonth}`,
      );
      const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
        where: {
          distributor_reportingMonth: {
            distributor,
            reportingMonth,
          },
        },
      });

      if (!baseReport) {
        const errorMessage = `Base report not found for distributor: ${distributor}, reportingMonth: ${reportingMonth}`;
        jobLogger.error(errorMessage);
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      this.logger.log(`Found base report ID: ${baseReport.id}`);

      // Find user reports for this base report
      jobLogger.log(
        `🔍 Finding user reports for baseReportId: ${baseReport.id}`,
      );
      this.logger.log(
        `Finding user reports for base report ID: ${baseReport.id}`,
      );
      const userReports = await this.prisma.userRoyaltyReport.findMany({
        where: { baseReportId: baseReport.id },
        include: { client: true },
      });

      if (userReports.length === 0) {
        const errorMessage = `No user reports found for baseReportId: ${baseReport.id}`;
        jobLogger.error(errorMessage);
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      jobLogger.log(`📊 Found ${userReports.length} user reports to export`);
      this.logger.log(`Found ${userReports.length} user reports to export`);

      // Process each user report
      let successCount = 0;
      let failureCount = 0;

      this.logger.log(
        `Starting export of ${userReports.length} user reports...`,
      );
      for (const userReport of userReports) {
        try {
          await this.exportSingleUserReport(userReport, jobLogger);
          successCount++;

          // Log progress periodically to avoid overwhelming logs
          if (successCount % 5 === 0 || successCount === userReports.length) {
            this.logger.log(
              `Exported ${successCount}/${userReports.length} user reports so far`,
            );
          }
        } catch (error) {
          failureCount++;
          jobLogger.error(
            `Failed to export user report ID: ${userReport.id} - ${error.message}`,
          );
          this.logger.error(
            `Failed to export user report ID: ${userReport.id} - ${error.message}`,
          );
          // Continue with other reports even if one fails
        }
      }

      jobLogger.log(
        `🏁 User royalty reports export complete: ${successCount} succeeded, ${failureCount} failed`,
      );
      this.logger.log(
        `✅ User reports export completed for ${distributor}/${reportingMonth}: ${successCount} succeeded, ${failureCount} failed`,
      );

      return {
        success: true,
        message: 'User royalty reports exported successfully.',
        totalReports: userReports.length,
        successCount,
        failureCount,
      };
    } catch (error) {
      jobLogger.error(`Error exporting user royalty reports: ${error.message}`);
      this.logger.error(
        `Error exporting user royalty reports for ${distributor}/${reportingMonth}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Exports a single user report to CSV and uploads it to S3
   *
   * @param userReport - The user report to export
   * @param logger - Logger for tracing the process
   */
  private async exportSingleUserReport(userReport: any, logger: BullJobLogger) {
    logger.log(
      `🔄 Exporting user report ID: ${userReport.id} for client: ${userReport.client?.name || 'Unknown'}`,
    );

    // Get royalty records
    let records;
    try {
      if (userReport.distributor === Distributor.KONTOR) {
        records = await this.prisma.kontorRoyaltyReport.findMany({
          where: { userReportId: userReport.id },
        });
      } else if (userReport.distributor === Distributor.BELIEVE) {
        records = await this.prisma.believeRoyaltyReport.findMany({
          where: { userReportId: userReport.id },
        });
      } else {
        throw new Error(`Unknown distributor: ${userReport.distributor}`);
      }

      logger.log(
        `📊 Found ${records.length} royalty records to include in export`,
      );

      if (records.length === 0) {
        logger.warn(
          `No royalty records found for user report ID: ${userReport.id}`,
        );
      }
    } catch (error) {
      logger.error(`Error fetching royalty records: ${error.message}`);
      throw error;
    }

    // Generate CSV data
    logger.log(`📝 Generating CSV data`);
    const csvData = await convertReportsToCsv(
      records,
      userReport.distributor,
      ReportType.USER,
    );

    // Create temporary file with proper directory handling
    const fileName = `${userReport.distributor}_${userReport.reportingMonth}_${userReport.baseReportId}_${userReport.id}.csv`;

    // Use 'temp' directory in the project root for compatibility with both Windows and Unix
    const tempDir = path.resolve(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      logger.log(`Creating temporary directory: ${tempDir}`);
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, fileName);

    try {
      logger.log(`📁 Writing CSV data to temporary file: ${filePath}`);
      fs.writeFileSync(filePath, csvData);
    } catch (error) {
      logger.error(`Error writing CSV to file: ${error.message}`);
      throw error;
    }

    // Upload to S3
    try {
      logger.log(`📤 Uploading file to S3: ${fileName}`);
      const s3Key = `user-reports/${userReport.baseReportId}/${userReport.clientId}/${fileName}`;
      const s3File = await this.s3UploadService.uploadFile(
        env.AWS_S3_BUCKET_NAME_ROYALTIES,
        s3Key,
        filePath,
      );

      // Update user report with S3 file reference
      await this.prisma.userRoyaltyReport.update({
        where: { id: userReport.id },
        data: { s3FileId: s3File.id },
      });

      logger.log(`✅ File uploaded successfully to S3, ID: ${s3File.id}`);
    } catch (error) {
      logger.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.log(`🧹 Temporary file deleted: ${filePath}`);
        }
      } catch (cleanupError) {
        logger.warn(
          `Error cleaning up temporary file: ${cleanupError.message}`,
        );
      }
    }

    logger.log(`✨ Successfully exported user report ID: ${userReport.id}`);
  }

  /**
   * Deletes all user royalty reports and their associated CSV files for a specific distributor and month
   *
   * @param distributor - The distributor source (KONTOR, BELIEVE)
   * @param reportingMonth - The reporting month in YYYY-MM format
   * @param jobId - ID of the job for logging
   * @returns Object with success message
   */
  async deleteUserRoyaltyReports(
    distributor: Distributor,
    reportingMonth: string,
    jobId?: string,
  ) {
    const jobLogger = new BullJobLogger(jobId, 'DeleteUserReports');

    try {
      jobLogger.log(
        `🚀 Starting deletion of user royalty reports for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      this.logger.log(
        `Starting deletion of user royalty reports for ${distributor}/${reportingMonth}`,
      );

      // First delete all associated S3 files
      await this.deleteExportedUserReports(
        distributor,
        reportingMonth,
        jobId,
        false,
      );

      // Then delete all user royalty reports
      const deleteResult = await this.prisma.userRoyaltyReport.deleteMany({
        where: { distributor, reportingMonth },
      });

      jobLogger.log(
        `✅ Successfully deleted ${deleteResult.count} user royalty reports`,
      );
      this.logger.log(
        `✅ Successfully deleted ${deleteResult.count} user royalty reports for ${distributor}/${reportingMonth}`,
      );

      return {
        success: true,
        message: 'User royalty reports and CSV files deleted successfully.',
        deletedReports: deleteResult.count,
      };
    } catch (error) {
      jobLogger.error(
        `Failed to delete user royalty reports: ${error.message}`,
      );
      this.logger.error(
        `Failed to delete user royalty reports for ${distributor}/${reportingMonth}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes only the exported CSV files for a specific distributor and month
   *
   * @param distributor - The distributor source (KONTOR, BELIEVE)
   * @param reportingMonth - The reporting month in YYYY-MM format
   * @param jobId - ID of the job for logging
   * @param standalone - Whether this is a standalone operation (true) or part of another operation (false)
   * @returns Object with success message
   */
  async deleteExportedUserReports(
    distributor: Distributor,
    reportingMonth: string,
    jobId?: string,
    standalone: boolean = true,
  ) {
    const jobLogger = new BullJobLogger(jobId, 'DeleteExportedUserReports');

    try {
      if (standalone) {
        jobLogger.log(
          `🚀 Starting deletion of exported CSV files for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
        );
        this.logger.log(
          `Starting deletion of exported CSV files for ${distributor}/${reportingMonth}`,
        );
      }

      // Find all reports that need to have their exports deleted
      const userReports = await this.prisma.userRoyaltyReport.findMany({
        where: { distributor, reportingMonth },
      });

      if (standalone) {
        jobLogger.log(`Found ${userReports.length} user reports to process`);
        this.logger.log(`Found ${userReports.length} user reports to process`);
      }

      // Delete all associated S3 files
      let deletedFilesCount = 0;
      for (const report of userReports) {
        if (report.s3FileId) {
          try {
            await this.s3UploadService.deleteFile({ id: report.s3FileId });
            deletedFilesCount++;

            // Update the report to remove the S3 file reference
            await this.prisma.userRoyaltyReport.update({
              where: { id: report.id },
              data: { s3FileId: null },
            });
          } catch (error) {
            jobLogger.error(
              `Error deleting S3 file for report ${report.id}: ${error.message}`,
            );
          }
        }
      }

      jobLogger.log(`Deleted ${deletedFilesCount} CSV files from S3`);
      this.logger.log(`Deleted ${deletedFilesCount} CSV files from S3`);

      if (standalone) {
        return {
          success: true,
          message: 'Exported CSV files deleted successfully from S3.',
          deletedFiles: deletedFilesCount,
        };
      } else {
        return deletedFilesCount;
      }
    } catch (error) {
      jobLogger.error(`Failed to delete exported CSV files: ${error.message}`);
      this.logger.error(
        `Failed to delete exported CSV files for ${distributor}/${reportingMonth}: ${error.message}`,
      );
      throw error;
    }
  }
}
