// src/resources/reports/reports.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Distributor } from '../../common/enums/distributor.enum';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import { mapBelieveData, mapKontorData } from './utils/csv-data-mapper';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async processCsv(filePath: string, distributor: Distributor) {
    const records = await this.parseCsvFile(filePath);
    await this.handleRecords(records, distributor);
  }

  private async parseCsvFile(filePath: string): Promise<any[]> {
    const parser = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ';',
        columns: true,
        trim: true,
        skip_empty_lines: true,
      }),
    );

    const records = [];
    for await (const record of parser) {
      records.push(record);
    }
    return records;
  }

  private async handleRecords(records: any[], distributor: Distributor) {
    const unlinkedReports: Record<string, { count: number; details: any[] }> =
      {};

    for (const record of records) {
      const labelName =
        distributor === Distributor.KONTOR
          ? record['Labelname']
          : record['Label Name'];

      if (!labelName) {
        console.error('Label name is missing for record:', record);
        continue;
      }

      const label = await this.prisma.label.findUnique({
        where: { name: labelName },
      });

      if (!label) {
        if (!unlinkedReports[labelName]) {
          unlinkedReports[labelName] = { count: 0, details: [] };
        }

        unlinkedReports[labelName].count += 1;
        unlinkedReports[labelName].details.push(record);
        continue;
      }

      const reportData =
        distributor === Distributor.KONTOR
          ? mapKontorData(record)
          : mapBelieveData(record);

      await this.prisma[`${distributor.toLowerCase()}RoyaltyReport`].create({
        data: { ...reportData, label: { connect: { id: label.id } } },
      });
    }

    // Guardar los unlinkedReports en la base de datos
    for (const [labelName, unlinkedReport] of Object.entries(unlinkedReports)) {
      const savedUnlinkedReport = await this.prisma.unlinkedReport.create({
        data: {
          labelName,
          count: unlinkedReport.count,
        },
      });

      for (const detail of unlinkedReport.details) {
        await this.prisma.unlinkedReportDetail.create({
          data: {
            unlinkedReportId: savedUnlinkedReport.id,
            data: detail,
          },
        });
      }
    }
  }
}
