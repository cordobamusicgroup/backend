// src/resources/reports/reports.service.ts

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { Distributor } from '../../common/enums/distributor.enum';
import { mapBelieveData, mapKontorData } from './utils/csv-data-mapper';

@Injectable()
export class ReportsService {
  constructor(
    @InjectQueue('reports') private readonly reportsQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async processCsv(filePath: string, distributor: Distributor) {
    await this.reportsQueue.add('processCsv', { filePath, distributor });
  }

  async getUnlinkedReports() {
    return this.prisma.unlinkedReport.findMany({
      include: {
        UnlinkedReportDetail: true,
      },
    });
  }

  async assignLabelToUnlinkedReports(
    labelId: number,
    unlinkedReportId: number,
    distributor: Distributor,
  ) {
    const unlinkedReport = await this.prisma.unlinkedReport.findUnique({
      where: { id: unlinkedReportId },
      include: { UnlinkedReportDetail: true },
    });

    if (!unlinkedReport) {
      throw new Error(`Unlinked report with ID ${unlinkedReportId} not found`);
    }

    const tasks = unlinkedReport.UnlinkedReportDetail.map((detail) => {
      const record = detail.data as Record<string, any>;

      const reportData =
        distributor === Distributor.KONTOR
          ? mapKontorData(record)
          : mapBelieveData(record);

      return this.prisma[`${distributor.toLowerCase()}RoyaltyReport`].create({
        data: {
          label: { connect: { id: labelId } },
          ...reportData,
        },
      });
    });

    await this.prisma.$transaction([
      ...tasks,
      this.prisma.unlinkedReportDetail.deleteMany({
        where: { unlinkedReportId },
      }),
      this.prisma.unlinkedReport.delete({
        where: { id: unlinkedReportId },
      }),
    ]);
  }
}
