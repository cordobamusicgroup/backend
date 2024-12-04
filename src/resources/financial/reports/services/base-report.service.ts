import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Distributor } from '@prisma/client';
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

@Injectable()
export class BaseReportService {
  private readonly logger = new Logger(BaseReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('import-reports') private readonly importReportsQueue: Queue,
  ) {}

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

      let totalRoyalties = new Decimal(0);
      let totalEarnings = new Decimal(0);
      let baseReport;

      if (distributor === Distributor.KONTOR) {
        this.logger.log(
          `Fetching Kontor reports for reportingMonth: ${reportingMonth}`,
        );
        const kontorReports = await this.prisma.kontorRoyaltyReport.findMany({
          where: { reportingMonth },
        });

        if (kontorReports.length === 0) {
          this.logger.warn(
            `No Kontor reports found for reportingMonth: ${reportingMonth}`,
          );
          throw new NoReportsFoundException();
        }

        totalRoyalties = kontorReports.reduce(
          (sum, report) => sum.plus(report.royalties),
          new Decimal(0),
        );
        totalEarnings = kontorReports.reduce((sum, report) => {
          const ppd = new Decimal(report.cmg_clientRate);
          const earningsOurs = new Decimal(report.royalties).mul(
            new Decimal(1).minus(ppd.div(100)),
          );
          return sum.plus(earningsOurs);
        }, new Decimal(0));

        this.logger.log(
          `Creating base report for Kontor with totalRoyalties: ${totalRoyalties.toFixed()}, totalEarnings: ${totalEarnings.toFixed()}`,
        );
        baseReport = await this.prisma.baseRoyaltyReport.create({
          data: {
            distributor,
            reportingMonth,
            totalRoyalties: totalRoyalties.toNumber(),
            totalEarnings: totalEarnings.toNumber(),
          },
        });

        await this.prisma.kontorRoyaltyReport.updateMany({
          where: { reportingMonth },
          data: { baseReportId: baseReport.id },
        });
      } else if (distributor === Distributor.BELIEVE) {
        this.logger.log(
          `Fetching Believe reports for reportingMonth: ${reportingMonth}`,
        );
        const believeReports = await this.prisma.believeRoyaltyReport.findMany({
          where: { reportingMonth },
        });

        if (believeReports.length === 0) {
          this.logger.warn(
            `No Believe reports found for reportingMonth: ${reportingMonth}`,
          );
          throw new NoReportsFoundException();
        }

        totalRoyalties = believeReports.reduce(
          (sum, report) => sum.plus(report.netRevenue),
          new Decimal(0),
        );
        totalEarnings = believeReports.reduce((sum, report) => {
          const ppd = new Decimal(report.cmg_clientRate);
          return sum.plus(new Decimal(report.netRevenue).mul(ppd.div(100)));
        }, new Decimal(0));

        this.logger.log(
          `Creating base report for Believe with totalRoyalties: ${totalRoyalties.toFixed()}, totalEarnings: ${totalEarnings.toFixed()}`,
        );
        baseReport = await this.prisma.baseRoyaltyReport.create({
          data: {
            distributor,
            reportingMonth,
            totalRoyalties: totalRoyalties.toNumber(),
            totalEarnings: totalEarnings.toNumber(),
          },
        });

        await this.prisma.believeRoyaltyReport.updateMany({
          where: { reportingMonth },
          data: { baseReportId: baseReport.id },
        });
      }

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

  async getAllBaseReports() {
    return this.prisma.baseRoyaltyReport.findMany({});
  }
}
