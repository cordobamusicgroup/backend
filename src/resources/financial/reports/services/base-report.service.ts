import { Injectable, Logger } from '@nestjs/common';
import { Distributor } from '@prisma/client';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import {
  UnlinkedReportsExistException,
  BaseReportAlreadyExistsException,
  NoReportsFoundException,
  UserRoyaltyReportsAlreadyExistException,
  BaseReportNotFoundException,
} from 'src/common/exceptions/CustomHttpException';

@Injectable()
export class BaseReportService {
  private readonly logger = new Logger(BaseReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createBaseReport(distributor: Distributor, reportingMonth: string) {
    this.logger.log(
      `Creating base report for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
    );

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

      let totalRoyalties = 0;
      let totalEarnings = 0;
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
          (sum, report) => sum + report.royalties,
          0,
        );
        totalEarnings = kontorReports.reduce((sum, report) => {
          const ppd = report.cmg_clientRate;
          const earningsOurs = report.royalties * (1 - ppd / 100);
          return sum + earningsOurs;
        }, 0);

        this.logger.log(
          `Creating base report for Kontor with totalRoyalties: ${totalRoyalties}, totalEarnings: ${totalEarnings}`,
        );
        baseReport = await this.prisma.baseRoyaltyReport.create({
          data: {
            distributor,
            reportingMonth,
            totalRoyalties,
            totalEarnings,
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
          (sum, report) => sum + report.netRevenue,
          0,
        );
        totalEarnings = believeReports.reduce((sum, report) => {
          const ppd = report.cmg_clientRate;
          return sum + report.netRevenue * (ppd / 100);
        }, 0);

        this.logger.log(
          `Creating base report for Believe with totalRoyalties: ${totalRoyalties}, totalEarnings: ${totalEarnings}`,
        );
        baseReport = await this.prisma.baseRoyaltyReport.create({
          data: {
            distributor,
            reportingMonth,
            totalRoyalties,
            totalEarnings,
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
