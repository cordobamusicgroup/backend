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

@Injectable()
export class BaseReportService {
  private readonly logger = new Logger(BaseReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('import-reports') private readonly importReportsQueue: Queue,
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

      this.logger.log(
        `Creating base report for ${distributor} with totalRoyalties: ${totalRoyalties.toFixed()}, totalEarnings: ${totalEarnings.toFixed()}`,
      );
      const baseReport = await this.prisma.baseRoyaltyReport.create({
        data: {
          distributor,
          reportingMonth,
          totalRoyalties: totalRoyalties.toNumber(),
          totalEarnings: totalEarnings.toNumber(),
        },
      });

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
   * Deletes a base report by its ID.
   * @param baseReportId The ID of the base report to delete.
   * @returns A promise that resolves to an object containing a message.
   */
  async deleteBaseReport(baseReportId: number) {
    this.logger.log(`Deleting base report with ID: ${baseReportId}`);

    try {
      const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
        where: { id: baseReportId },
      });

      if (!baseReport) {
        this.logger.warn(`Base report does not exist with ID: ${baseReportId}`);
        throw new BaseReportNotFoundException();
      }

      const userReports = await this.prisma.userRoyaltyReport.findMany({
        where: { baseReportId: baseReport.id },
      });

      if (userReports.length > 0) {
        this.logger.warn(
          `User reports exist for baseReportId: ${baseReport.id}`,
        );
        throw new UserRoyaltyReportsAlreadyExistException(baseReport.id);
      }

      if (baseReport.distributor === Distributor.KONTOR) {
        await this.prisma.kontorRoyaltyReport.deleteMany({
          where: { reportingMonth: baseReport.reportingMonth },
        });
      } else if (baseReport.distributor === Distributor.BELIEVE) {
        await this.prisma.believeRoyaltyReport.deleteMany({
          where: { reportingMonth: baseReport.reportingMonth },
        });
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
        `Base report deleted successfully with ID: ${baseReportId}`,
      );
      return {
        message: 'Base report deleted successfully.',
      };
    } catch (error) {
      this.logger.error(`Failed to delete base report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves all base reports.
   * @returns A promise that resolves to an array of base reports.
   */
  async getAllBaseReports() {
    return this.prisma.baseRoyaltyReport.findMany({});
  }

  /**
   * Generates payments for a base report by its ID.
   * @param baseReportId The ID of the base report for which to generate payments.
   * @returns A promise that resolves to an object containing a message.
   */
  async generatePayments(baseReportId: number) {
    this.logger.log(`Generating payments for base report ID: ${baseReportId}`);

    const baseReport = await this.prisma.baseRoyaltyReport.findUnique({
      where: { id: baseReportId },
      include: { userReports: true },
    });

    if (!baseReport) {
      this.logger.warn(`Base report does not exist with ID: ${baseReportId}`);
      throw new BaseReportNotFoundException();
    }

    if (baseReport.debitState === 'PAID') {
      this.logger.warn(
        `Payments have already been generated for base report ID: ${baseReportId}`,
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
      `Payments generated successfully for base report ID: ${baseReportId}`,
    );
    return { message: 'Payments generated successfully.' };
  }

  /**
   * Deletes payments for a base report by its ID.
   * @param baseReportId The ID of the base report for which to delete payments.
   * @returns A promise that resolves to an object containing a message.
   */
  async deletePayments(baseReportId: number) {
    this.logger.log(`Deleting payments for base report ID: ${baseReportId}`);

    const transactions = await this.prisma.transaction.findMany({
      where: { baseReportId },
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
      where: { baseReportId },
      data: { debitState: 'UNPAID' },
    });

    // Revert base report debitState to UNPAID
    await this.prisma.baseRoyaltyReport.update({
      where: { id: baseReportId },
      data: { debitState: 'UNPAID' },
    });

    this.logger.log(
      `Payments deleted successfully for base report ID: ${baseReportId}`,
    );
    return { message: 'Payments deleted successfully.' };
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
    let totalEarnings = new Decimal(0);

    if (distributor === Distributor.KONTOR) {
      totalRoyalties = reports.reduce(
        (sum, report) => sum.plus(report.royalties),
        new Decimal(0),
      );
      totalEarnings = reports.reduce((sum, report) => {
        const ppd = new Decimal(report.cmg_clientRate);
        const earningsOurs = new Decimal(report.royalties).mul(
          new Decimal(1).minus(ppd.div(100)),
        );
        return sum.plus(earningsOurs);
      }, new Decimal(0));
    } else if (distributor === Distributor.BELIEVE) {
      totalRoyalties = reports.reduce(
        (sum, report) => sum.plus(report.netRevenue),
        new Decimal(0),
      );
      totalEarnings = reports.reduce((sum, report) => {
        const ppd = new Decimal(report.cmg_clientRate);
        return sum.plus(new Decimal(report.netRevenue).mul(ppd.div(100)));
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
}