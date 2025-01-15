import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Distributor, TransactionType } from '@prisma/client';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import {
  UnlinkedReportsExistException,
  BaseReportAlreadyExistsException,
  NoReportsFoundException,
  UserRoyaltyReportsAlreadyExistException,
  BaseReportNotFoundException,
} from 'src/common/exceptions/CustomHttpException';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import Decimal from 'decimal.js';
import * as dayjs from 'dayjs';
import { S3Service } from 'src/common/services/s3.service';
import {
  convertReportsToCsv,
  ReportType,
} from '../../utils/convert-reports-csv';
import * as fs from 'fs';
import env from 'src/config/env.config';
import { BaseReportDto } from '../../dto/admin-base-reports.dto';

@Injectable()
export class AdminBaseReportService {
  private readonly logger = new Logger(AdminBaseReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('import-reports') private readonly importReportsQueue: Queue,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Creates a base report for the given distributor and reporting month.
   * @param distributor The distributor for which to create the base report.
   * @param reportingMonth The reporting month for which to create the base report.
   * @returns A promise that resolves to an object containing a message and the created base report.
   */
  async createBaseReport(distributor: Distributor, reportingMonth: string) {
    this.logger.log(
      `Creating base report for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
    );

    if (await this.checkForExistingImportJob(distributor, reportingMonth)) {
      this.logger.warn(
        `An import job is already in progress for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      throw new BadRequestException(
        'An import job is already in progress for the given distributor and reporting month.',
      );
    }

    try {
      const existingReport = await this.prisma.baseRoyaltyReport.findUnique({
        where: { distributor_reportingMonth: { distributor, reportingMonth } },
      });

      if (existingReport) {
        this.logger.warn(
          `Base report already exists for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
        );
        throw new BaseReportAlreadyExistsException();
      }

      const unlinkedReports = await this.prisma.unlinkedReport.findMany({
        where: { distributor, reportingMonth },
      });

      if (unlinkedReports.length > 0) {
        this.logger.warn(
          `Unlinked reports exist for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
        );
        throw new UnlinkedReportsExistException();
      }

      const reports = await this.getReports(distributor, reportingMonth);

      if (reports.length === 0) {
        this.logger.warn(
          `No reports found for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
        );
        throw new NoReportsFoundException();
      }

      const { totalRoyalties, totalEarnings } = this.calculateTotals(
        reports,
        distributor,
      );

      const currency = distributor === Distributor.KONTOR ? 'EUR' : 'USD';

      this.logger.log(
        `Creating base report for ${distributor} with totalRoyalties: ${totalRoyalties.toFixed()}, totalEarnings: ${totalEarnings.toFixed()}`,
      );

      const baseReport = await this.prisma.baseRoyaltyReport.create({
        data: {
          distributor,
          reportingMonth,
          totalRoyalties: totalRoyalties.toNumber(),
          totalEarnings: totalEarnings.toNumber(),
          currency,
        },
      });

      await this.uploadAndLinkBaseReportCsv(baseReport, reports);

      await this.updateReportsWithBaseReportId(
        distributor,
        reportingMonth,
        baseReport.id,
      );

      this.logger.log(
        `Base report created successfully for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      return {
        message: 'Base report created successfully.',
        baseReport,
      };
    } catch (error) {
      this.logger.error(`Failed to create base report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a base report by distributor and reporting month.
   * @param distributor The distributor for which to delete the base report.
   * @param reportingMonth The reporting month for which to delete the base report.
   * @param deleteImported Whether to delete imported reports.
   * @returns A promise that resolves to an object containing a message.
   */
  async deleteBaseReport(distributor: Distributor, reportingMonth: string) {
    this.logger.log(
      `Deleting base report for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
    );

    const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
      where: { distributor_reportingMonth: { distributor, reportingMonth } },
    });

    if (!baseReport) {
      this.logger.warn(
        `Base report does not exist for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      throw new BaseReportNotFoundException();
    }

    const userReports = await this.prisma.userRoyaltyReport.findMany({
      where: { baseReportId: baseReport.id },
    });

    if (userReports.length > 0) {
      this.logger.warn(`User reports exist for baseReportId: ${baseReport.id}`);
      throw new UserRoyaltyReportsAlreadyExistException(baseReport.id);
    }

    // Delete unlinked reports for the given period and distributor
    await this.prisma.unlinkedReport.deleteMany({
      where: {
        distributor: baseReport.distributor,
        reportingMonth: baseReport.reportingMonth,
      },
    });

    await this.prisma.baseRoyaltyReport.delete({
      where: { id: baseReport.id },
    });

    this.logger.log(
      `Base report deleted successfully with ID: ${baseReport.id}`,
    );
    return {
      message: 'Base report deleted successfully.',
    };
  }

  /**
   * Retrieves all base reports.
   * @returns A promise that resolves to an array of base reports.
   */
  async getAllBaseReports(): Promise<BaseReportDto[]> {
    const baseReports = await this.prisma.baseRoyaltyReport.findMany({
      include: { s3File: true },
    });

    return await Promise.all(
      baseReports.map((report) => this.convertToDto(report)),
    );
  }

  /**
   * Generates payments for a base report by distributor and reporting month.
   * @param distributor The distributor for which to generate payments.
   * @param reportingMonth The reporting month for which to generate payments.
   * @returns A promise that resolves to an object containing a message.
   */
  async generatePayments(distributor: Distributor, reportingMonth: string) {
    this.logger.log(
      `Generating payments for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
    );

    const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
      where: { distributor_reportingMonth: { distributor, reportingMonth } },
      include: { userReports: true },
    });

    if (!baseReport) {
      this.logger.warn(
        `Base report does not exist for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      throw new BaseReportNotFoundException();
    }

    if (baseReport.debitState === 'PAID') {
      this.logger.warn(
        `Payments have already been generated for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      throw new BadRequestException(
        'Payments have already been generated for this base report.',
      );
    }

    for (const userReport of baseReport.userReports) {
      const client = await this.prisma.client.findUnique({
        where: { id: userReport.clientId },
      });

      if (!client) {
        this.logger.warn(
          `Client not found for user report ID: ${userReport.id}`,
        );
        continue;
      }

      let balance = await this.prisma.balance.findFirst({
        where: { clientId: client.id, currency: userReport.currency },
      });

      if (!balance) {
        this.logger.log(
          `Creating balance for client ID: ${client.id} and currency: ${userReport.currency}`,
        );
        balance = await this.prisma.balance.create({
          data: {
            clientId: client.id,
            currency: userReport.currency,
            amount: 0,
          },
        });
      }

      const newBalanceAmount = new Decimal(balance.amount).plus(
        userReport.totalRoyalties,
      );

      await this.prisma.transaction.create({
        data: {
          type: TransactionType.ROYALTIES,
          description: `Royalties for ${dayjs(userReport.reportingMonth).format('YYYY.MM')}`,
          amount: userReport.totalRoyalties,
          balanceAmount: newBalanceAmount.toNumber(),
          balanceId: balance.id,
          baseReportId: baseReport.id,
          userReportId: userReport.id,
          distributor: baseReport.distributor,
        },
      });

      await this.prisma.balance.update({
        where: { id: balance.id },
        data: { amount: newBalanceAmount.toNumber() },
      });

      // Update user report debitState to PAID
      await this.prisma.userRoyaltyReport.update({
        where: { id: userReport.id },
        data: {
          debitState: 'PAID',
          paidOn: new Date(), // Add this line to set the paidOn field
        },
      });
    }

    // Update base report debitState to PAID
    await this.prisma.baseRoyaltyReport.update({
      where: { id: baseReport.id },
      data: {
        debitState: 'PAID',
        paidOn: new Date(),
      },
    });

    this.logger.log(
      `Payments generated successfully for base report ID: ${baseReport.id}`,
    );
    return { message: 'Payments generated successfully.' };
  }

  /**
   * Deletes payments for a base report by distributor and reporting month.
   * @param distributor The distributor for which to delete payments.
   * @param reportingMonth The reporting month for which to delete payments.
   * @returns A promise that resolves to an object containing a message.
   */
  async deletePayments(distributor: Distributor, reportingMonth: string) {
    this.logger.log(
      `Deleting payments for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
    );

    const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
      where: { distributor_reportingMonth: { distributor, reportingMonth } },
    });

    if (!baseReport) {
      this.logger.warn(
        `Base report does not exist for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      throw new BaseReportNotFoundException();
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { baseReportId: baseReport.id },
    });

    for (const transaction of transactions) {
      const balance = await this.prisma.balance.findUnique({
        where: { id: transaction.balanceId },
      });

      if (!balance) {
        this.logger.warn(
          `Balance not found for transaction ID: ${transaction.id}`,
        );
        continue;
      }

      const newBalanceAmount = new Decimal(balance.amount)
        .minus(new Decimal(transaction.amount))
        .toNumber();

      await this.prisma.balance.update({
        where: { id: balance.id },
        data: { amount: newBalanceAmount },
      });

      await this.prisma.transaction.delete({
        where: { id: transaction.id },
      });
    }

    // Revert user reports debitState to UNPAID
    await this.prisma.userRoyaltyReport.updateMany({
      where: { baseReportId: baseReport.id },
      data: { debitState: 'UNPAID' },
    });

    // Revert base report debitState to UNPAID
    await this.prisma.baseRoyaltyReport.update({
      where: { id: baseReport.id },
      data: { debitState: 'UNPAID' },
    });

    this.logger.log(
      `Payments deleted successfully for base report ID: ${baseReport.id}`,
    );
    return { message: 'Payments deleted successfully.' };
  }

  /**
   * Recalculates total royalties and earnings for the given distributor and reporting month.
   * @param distributor The distributor for which to recalculate totals.
   * @param reportingMonth The reporting month for which to recalculate totals.
   * @returns A promise that resolves to an object containing the recalculated totals.
   */
  async recalculateTotals(distributor: Distributor, reportingMonth: string) {
    this.logger.log(
      `Recalculating totals for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
    );

    const reports = await this.getReports(distributor, reportingMonth);

    if (reports.length === 0) {
      this.logger.warn(
        `No reports found for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      throw new NoReportsFoundException();
    }

    const { totalRoyalties, totalEarnings } = this.calculateTotals(
      reports,
      distributor,
    );

    this.logger.log(
      `Recalculated totals for ${distributor} with totalRoyalties: ${totalRoyalties.toFixed()}, totalEarnings: ${totalEarnings.toFixed()}`,
    );

    // Update the base report with the recalculated totals
    await this.prisma.baseRoyaltyReport.update({
      where: { distributor_reportingMonth: { distributor, reportingMonth } },
      data: {
        totalRoyalties: totalRoyalties.toNumber(),
        totalEarnings: totalEarnings.toNumber(),
      },
    });

    return {
      totalRoyalties: totalRoyalties.toNumber(),
      totalEarnings: totalEarnings.toNumber(),
    };
  }

  /**
   * Generates a base report CSV file for the given distributor and reporting month.
   * @param distributor The distributor for which to generate the base report CSV.
   * @param reportingMonth The reporting month for which to generate the base report CSV.
   * @returns A promise that resolves to the uploaded S3 file.
   */
  async generateBaseReportCsv(
    distributor: Distributor,
    reportingMonth: string,
  ): Promise<BaseReportDto> {
    const reports = await this.getReports(distributor, reportingMonth);
    const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
      where: { distributor_reportingMonth: { distributor, reportingMonth } },
    });

    if (!baseReport) {
      throw new BaseReportNotFoundException();
    }

    await this.uploadAndLinkBaseReportCsv(baseReport, reports);

    return this.convertToDto(baseReport);
  }

  /**
   * Retrieves a base report with a signed URL for the given ID.
   * @param id The ID of the base report to retrieve.
   * @returns A promise that resolves to the base report with a signed URL.
   */
  async getBaseReportWithSignedUrl(id: number): Promise<BaseReportDto> {
    const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
      where: { id },
      include: { s3File: true },
    });

    if (!baseReport) {
      throw new BaseReportNotFoundException();
    }

    return this.convertToDto(baseReport);
  }

  // Private methods section

  /**
   * Checks if there is an existing import job for the given distributor and reporting month.
   * @param distributor The distributor to check.
   * @param reportingMonth The reporting month to check.
   * @returns A promise that resolves to a boolean indicating if an import job exists.
   */
  private async checkForExistingImportJob(
    distributor: Distributor,
    reportingMonth: string,
  ): Promise<boolean> {
    const jobs = await this.importReportsQueue.getJobs([
      'active',
      'waiting',
      'delayed',
    ]);
    return jobs.some(
      (job) =>
        job.data.distributor === distributor &&
        job.data.reportingMonth === reportingMonth,
    );
  }

  /**
   * Retrieves reports for the given distributor and reporting month.
   * @param distributor The distributor for which to retrieve reports.
   * @param reportingMonth The reporting month for which to retrieve reports.
   * @returns A promise that resolves to an array of reports.
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

  /**
   * Calculates total royalties and total earnings from the given reports.
   * @param reports The reports from which to calculate totals.
   * @param distributor The distributor for which to calculate totals.
   * @returns An object containing total royalties and total earnings.
   */
  private calculateTotals(reports: any[], distributor: Distributor) {
    let totalRoyalties = new Decimal(0);
    let totalEarnings = new Decimal(0); // Representa el valor restante (ganancias)

    if (distributor === Distributor.KONTOR) {
      totalRoyalties = reports.reduce(
        (sum, report) => sum.plus(new Decimal(report.royalties || 0)),
        new Decimal(0),
      );
      totalEarnings = reports.reduce((sum, report) => {
        const report_royalties = new Decimal(report.royalties || 0);
        const cmg_netRevenue = new Decimal(report.cmg_netRevenue || 0);
        return sum.plus(report_royalties.minus(cmg_netRevenue)); // Ganancias (porcentaje restante)
      }, new Decimal(0));
    } else if (distributor === Distributor.BELIEVE) {
      totalRoyalties = reports.reduce(
        (sum, report) => sum.plus(new Decimal(report.netRevenue || 0)),
        new Decimal(0),
      );
      totalEarnings = reports.reduce((sum, report) => {
        const report_royalties = new Decimal(report.netRevenue || 0);
        const cmg_netRevenue = new Decimal(report.cmg_netRevenue || 0);
        return sum.plus(report_royalties.minus(cmg_netRevenue)); // Ganancias (porcentaje)
      }, new Decimal(0));
    }

    return { totalRoyalties, totalEarnings };
  }

  /**
   * Updates reports with the given base report ID.
   * @param distributor The distributor for which to update reports.
   * @param reportingMonth The reporting month for which to update reports.
   * @param baseReportId The base report ID to set in the reports.
   */
  private async updateReportsWithBaseReportId(
    distributor: Distributor,
    reportingMonth: string,
    baseReportId: number,
  ) {
    if (distributor === Distributor.KONTOR) {
      await this.prisma.kontorRoyaltyReport.updateMany({
        where: { reportingMonth },
        data: { baseReportId },
      });
    } else if (distributor === Distributor.BELIEVE) {
      await this.prisma.believeRoyaltyReport.updateMany({
        where: { reportingMonth },
        data: { baseReportId },
      });
    }
  }

  private async uploadAndLinkBaseReportCsv(baseReport: any, reports: any[]) {
    try {
      this.logger.log(`Generating CSV for base report ID: ${baseReport.id}`);
      const csvData = await convertReportsToCsv(
        reports,
        baseReport.distributor,
        ReportType.BASE, // Specify report type as BASE
      );
      const fileName = `${baseReport.distributor}_${baseReport.reportingMonth}_base_report.csv`;
      const filePath = `/tmp/${fileName}`;
      fs.writeFileSync(filePath, csvData);

      const s3Key = `base-reports/${baseReport.distributor}/${baseReport.reportingMonth}/${fileName}`;
      const s3File = await this.s3Service.uploadFile(
        env.AWS_S3_BUCKET_NAME_ROYALTIES,
        s3Key,
        filePath,
      );

      await this.prisma.baseRoyaltyReport.update({
        where: { id: baseReport.id },
        data: { s3FileId: s3File.id },
      });

      this.logger.log(
        `CSV generated and uploaded for base report ID: ${baseReport.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate and upload CSV for base report ID: ${baseReport.id}: ${error.message}`,
      );
      throw error;
    }
  }

  private async convertToDto(baseReport: any): Promise<BaseReportDto> {
    let signedUrl;
    if (baseReport.s3FileId) {
      try {
        const s3File = await this.s3Service.getFile({
          id: baseReport.s3FileId,
        });
        signedUrl = s3File.url;
      } catch (error) {
        this.logger.error(
          `Failed to retrieve signed URL for S3 file ID: ${baseReport.s3FileId}: ${error.message}`,
        );
        signedUrl = undefined;
      }
    }

    return {
      id: baseReport.id,
      distributor: baseReport.distributor,
      reportingMonth: baseReport.reportingMonth,
      currency: baseReport.currency,
      totalRoyalties: baseReport.totalRoyalties,
      totalEarnings: baseReport.totalEarnings,
      url: signedUrl,
    };
  }
}
