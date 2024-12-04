import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Distributor } from '@prisma/client';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { ReportsService } from './reports.service';

@Injectable()
export class ImportedReportsService {
  private readonly logger = new Logger(ImportedReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processRecordsService: ReportsService,
  ) {}

  async deleteImportedReports(
    reportingMonth: string,
    distributor: Distributor,
  ) {
    const result = {
      deleted: 0,
      retained: 0,
      reasons: [],
    };

    try {
      if (distributor === Distributor.BELIEVE) {
        const reports = await this.prisma.believeRoyaltyReport.findMany({
          where: { reportingMonth, baseReportId: null, userReportId: null },
        });

        for (const report of reports) {
          await this.prisma.believeRoyaltyReport.delete({
            where: { id: report.id },
          });
          result.deleted++;
        }

        result.retained = await this.prisma.believeRoyaltyReport.count({
          where: {
            reportingMonth,
            baseReportId: { not: null },
            userReportId: { not: null },
          },
        });
      } else if (distributor === Distributor.KONTOR) {
        const reports = await this.prisma.kontorRoyaltyReport.findMany({
          where: { reportingMonth, baseReportId: null, userReportId: null },
        });

        for (const report of reports) {
          await this.prisma.kontorRoyaltyReport.delete({
            where: { id: report.id },
          });
          result.deleted++;
        }

        result.retained = await this.prisma.kontorRoyaltyReport.count({
          where: {
            reportingMonth,
            baseReportId: { not: null },
            userReportId: { not: null },
          },
        });
      }

      // Delete unlinked reports
      await this.processRecordsService.deleteUnlinkedReports(
        distributor,
        reportingMonth,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to delete imported reports: ${error.message}`);
      throw new BadRequestException('Failed to delete imported reports.');
    }
  }
}
