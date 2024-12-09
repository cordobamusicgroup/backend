// src/resources/financial/reports/base-report.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ProgressService } from 'src/common/services/progress.service';
import { Distributor } from '@prisma/client';
import { UserRoyaltyReportsAlreadyExistException } from 'src/common/exceptions/CustomHttpException';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { EmailService } from 'src/resources/email/email.service';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { S3Service } from 'src/common/services/s3.service';
import * as fs from 'fs';
import { convertUserReportsToCsv } from '../utils/convert-user-reports-csv';
import Decimal from 'decimal.js';

@Processor('user-reports')
export class UserReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(UserReportsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly loggerTxt: LoggerTxtService,
    private readonly emailService: EmailService,
    private readonly s3UploadService: S3Service,
  ) {
    super();
  }

  private logMessage(
    type: 'warn' | 'info' | 'error',
    action: string,
    message: string,
    jobId?: string,
  ) {
    switch (type) {
      case 'warn':
        this.logger.warn(`[JOB ${jobId} - ${action}] ${message}`);
        this.loggerTxt.logWarn(message, jobId, action);
        break;
      case 'info':
        this.logger.log(`[JOB ${jobId} - ${action}] ${message}`);
        this.loggerTxt.logInfo(message, jobId, action);
        break;
      case 'error':
        this.logger.error(`[JOB ${jobId} - ${action}] ${message}`);
        this.loggerTxt.logError(message, jobId, action);
        break;
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'generate':
          return await this.generateUserRoyaltyReports(
            job.data.baseReportId,
            job.data.email,
            job.id,
          );
        case 'delete':
          return await this.deleteUserRoyaltyReports(
            job.data.baseReportId,
            job.data.email,
            job.id,
          );
        case 'export':
          return await this.exportUserReports(
            job.data.baseReportId,
            job.data.email,
            job.id,
          );
        default:
          this.logger.error(`Unknown job name: ${job.name}`);
          return null;
      }
    } catch (error) {
      this.logger.error(`Error processing job ${job.name}: ${error.message}`);
      throw error;
    }
  }

  async generateUserRoyaltyReports(
    baseReportId: number,
    email: string,
    jobId?: string,
  ) {
    try {
      this.logMessage(
        'info',
        'GenerateUserReports',
        `Starting generation of user royalty reports for baseReportId: ${baseReportId}`,
        jobId,
      );

      const existingReports = await this.prisma.userRoyaltyReport.findMany({
        where: { baseReportId },
      });

      if (existingReports.length > 0) {
        const errorMessage = `User royalty reports already exist for baseReportId: ${baseReportId}`;
        this.logMessage('error', 'GenerateUserReports', errorMessage, jobId);
        throw new UserRoyaltyReportsAlreadyExistException(baseReportId);
      }

      const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
        where: { id: baseReportId },
        include: {
          kontorReports: { include: { label: { include: { client: true } } } },
          believeReports: { include: { label: { include: { client: true } } } },
        },
      });

      if (!baseReport) {
        const errorMessage = `Base report not found for baseReportId: ${baseReportId}`;
        this.logMessage('error', 'GenerateUserReports', errorMessage, jobId);
        throw new Error('Base report not found');
      }

      const clientIds = new Set<number>();

      baseReport.kontorReports.forEach((report) => {
        if (report.label && report.label.client) {
          clientIds.add(report.label.client.id);
        }
      });

      baseReport.believeReports.forEach((report) => {
        if (report.label && report.label.client) {
          clientIds.add(report.label.client.id);
        }
      });

      if (clientIds.size === 0) {
        const errorMessage = 'No reports found to determine client';
        this.logMessage('error', 'GenerateUserReports', errorMessage, jobId);
        throw new Error('No reports found to determine client');
      }

      this.logMessage(
        'info',
        'GenerateUserReports',
        `Client IDs determined: ${Array.from(clientIds).join(', ')}`,
        jobId,
      );

      const userReportsData = [];

      for (const clientId of clientIds) {
        let totalRoyalties = new Decimal(0);

        if (baseReport.distributor === Distributor.KONTOR) {
          const filteredReports = baseReport.kontorReports.filter(
            (report) =>
              report.label &&
              report.label.client &&
              report.label.client.id === clientId,
          );
          totalRoyalties = filteredReports.reduce(
            (sum, report) => sum.plus(report.cmg_netRevenue),
            new Decimal(0),
          );
        }

        if (baseReport.distributor === Distributor.BELIEVE) {
          const filteredReports = baseReport.believeReports.filter(
            (report) =>
              report.label &&
              report.label.client &&
              report.label.client.id === clientId,
          );
          totalRoyalties = filteredReports.reduce(
            (sum, report) => sum.plus(report.cmg_netRevenue),
            new Decimal(0),
          );
        }

        const userReport = await this.prisma.userRoyaltyReport.create({
          data: {
            distributor: baseReport.distributor,
            reportingMonth: baseReport.reportingMonth,
            totalRoyalties: totalRoyalties.toNumber(),
            baseReportId: baseReport.id,
            clientId: clientId,
          },
        });

        if (baseReport.distributor === Distributor.KONTOR) {
          await this.prisma.kontorRoyaltyReport.updateMany({
            where: {
              reportingMonth: baseReport.reportingMonth,
              label: { clientId: clientId },
            },
            data: { userReportId: userReport.id },
          });
        }

        if (baseReport.distributor === Distributor.BELIEVE) {
          await this.prisma.believeRoyaltyReport.updateMany({
            where: {
              reportingMonth: baseReport.reportingMonth,
              label: { clientId: clientId },
            },
            data: { userReportId: userReport.id },
          });
        }

        userReportsData.push(userReport);
      }

      this.logMessage(
        'info',
        'GenerateUserReports',
        `User royalty reports generated successfully for baseReportId: ${baseReportId}`,
        jobId,
      );

      return {
        message: 'User royalty reports generated successfully.',
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteUserRoyaltyReports(
    baseReportId: number,
    email: string,
    jobId?: string,
  ) {
    try {
      this.logMessage(
        'info',
        'DeleteUserReports',
        `Starting deletion of user royalty reports for baseReportId: ${baseReportId}`,
        jobId,
      );

      await this.prisma.userRoyaltyReport.deleteMany({
        where: { baseReportId },
      });

      this.logMessage(
        'info',
        'DeleteUserReports',
        `User royalty reports deleted successfully for baseReportId: ${baseReportId}`,
        jobId,
      );

      return {
        message: 'User royalty reports deleted successfully.',
      };
    } catch (error) {
      this.logMessage(
        'error',
        'DeleteUserReports',
        `Error deleting user royalty reports: ${error.message}`,
        jobId,
      );
      throw error;
    }
  }

  async exportUserReports(baseReportId: number, email: string, jobId?: string) {
    try {
      this.logMessage(
        'info',
        'ExportUserReports',
        `Starting export of user royalty reports for baseReportId: ${baseReportId}`,
        jobId,
      );

      const userReports = await this.prisma.userRoyaltyReport.findMany({
        where: { baseReportId },
        include: { client: true },
      });

      if (userReports.length === 0) {
        const errorMessage = `No user reports found for baseReportId: ${baseReportId}`;
        this.logMessage('error', 'ExportUserReports', errorMessage, jobId);
        throw new Error(errorMessage);
      }

      for (const userReport of userReports) {
        let records;
        if (userReport.distributor === Distributor.KONTOR) {
          records = await this.prisma.kontorRoyaltyReport.findMany({
            where: { userReportId: userReport.id },
          });
        } else if (userReport.distributor === Distributor.BELIEVE) {
          records = await this.prisma.believeRoyaltyReport.findMany({
            where: { userReportId: userReport.id },
          });
        } else {
          const errorMessage = `Unknown distributor: ${userReport.distributor}`;
          this.logMessage('error', 'ExportUserReports', errorMessage, jobId);
          throw new Error(errorMessage);
        }

        const csvData = await convertUserReportsToCsv(records);
        const fileName = `${userReport.distributor}_${userReport.reportingMonth}_${baseReportId}_${userReport.id}.csv`;
        const filePath = `/tmp/${fileName}`;
        fs.writeFileSync(filePath, csvData);

        const s3Key = `user-reports/${baseReportId}/${userReport.clientId}/${fileName}`;
        const s3File = await this.s3UploadService.uploadFile(
          process.env.S3_BUCKET_NAME_ROYALTIES,
          s3Key,
          filePath,
        );

        await this.prisma.userRoyaltyReport.update({
          where: { id: userReport.id },
          data: { s3FileId: s3File.id },
        });
      }

      this.logMessage(
        'info',
        'ExportUserReports',
        `User royalty reports exported successfully for baseReportId: ${baseReportId}`,
        jobId,
      );

      return {
        message: 'User royalty reports exported successfully.',
      };
    } catch (error) {
      this.logMessage(
        'error',
        'ExportUserReports',
        `Error exporting user royalty reports: ${error.message}`,
        jobId,
      );
      throw error;
    }
  }
}
