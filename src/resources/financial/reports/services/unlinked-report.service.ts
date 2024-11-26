import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { Distributor } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bull';
import { LinkUnlinkedReportDto } from '../dto/link-unlinked-report.dto';

@Injectable()
export class UnlinkedReportService {
  private readonly logger = new Logger(UnlinkedReportService.name);

  constructor(
    @InjectQueue('link-unlinked-reports') private linkUnlinkedReports: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async linkUnlinkedReport(linkUnlinkedReportDto: LinkUnlinkedReportDto) {
    const { unlinkedReportId, labelId } = linkUnlinkedReportDto;
    try {
      await this.linkUnlinkedReports.add('linking-reports', {
        unlinkedReportId,
        labelId,
      });

      return {
        message: 'Unlinked Report queued for processing.',
        unlinkedReportId,
        labelId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue Unlinked Report for processing: ${error.message}`,
      );
      throw new Error(
        `Failed to queue Unlinked Report for processing: ${error.message}`,
      );
    }
  }

  async getUnlinkedRecords(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.findUnique({
      where: { id: unlinkedReportId },
      include: { UnlinkedReportDetail: true },
    });
  }

  async getAllUnlinkedReports() {
    return this.prisma.unlinkedReport.findMany({});
  }

  async deleteUnlinkedReport(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.delete({
      where: { id: unlinkedReportId },
    });
  }

  async saveUnlinkedRecord(
    record: any,
    distributor: Distributor,
    reportingMonth: string,
  ) {
    const unlinkedReport = await this.prisma.unlinkedReport.findFirst({
      where: { labelName: record.labelName },
    });

    if (unlinkedReport) {
      await this.prisma.unlinkedReport.update({
        where: { id: unlinkedReport.id },
        data: {
          count: { increment: 1 },
          UnlinkedReportDetail: {
            create: { data: record },
          },
        },
      });
    } else {
      await this.prisma.unlinkedReport.create({
        data: {
          distributor,
          reportingMonth,
          labelName: record.labelName,
          count: 1,
          UnlinkedReportDetail: { create: { data: record } },
        },
      });
    }
  }
}
