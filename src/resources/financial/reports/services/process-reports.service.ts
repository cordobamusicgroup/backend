// src/resources/financial/reports/reports.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ContractType, Distributor } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bull';
import { mapCsvToRecord } from '../utils/csv-mapper.util';
import { parse } from 'fast-csv';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { UploadCsvDto } from '../dto/upload-csv.dto';
import { UnlinkedReportService } from './unlinked-report.service';

@Injectable()
export class ProcessReportsService {
  private readonly logger = new Logger(ProcessReportsService.name);

  constructor(
    @InjectQueue('import-reports') private importReportsQueue: Queue,
    @InjectQueue('link-unlinked-reports') private linkUnlinkedReports: Queue,

    private readonly prisma: PrismaService,
    private readonly loggerTxt: LoggerTxtService,
    private readonly unlinkedReportService: UnlinkedReportService,
  ) {}

  /**
   * Uploads a CSV file to the processing queue.
   * @param uploadCsvDto The DTO containing the CSV file and related data.
   * @returns A message indicating the CSV file has been queued for processing.
   */
  async uploadCsvToQueue(uploadCsvDto: UploadCsvDto) {
    const { file, reportingMonth, distributor } = uploadCsvDto;
    const tempFilePath = path.resolve(file.path);

    try {
      await this.importReportsQueue.add('parse-csv', {
        filePath: tempFilePath,
        reportingMonth,
        distributor,
      });

      return {
        message: 'CSV file queued for processing.',
        distributor,
        reportingMonth,
      };
    } catch (error) {
      this.logger.error(`Failed to queue CSV for processing: ${error.message}`);
      throw new Error(`Failed to queue CSV for processing: ${error.message}`);
    }
  }

  /**
   * Reads a CSV file and maps its content to records.
   * @param filePath The path to the CSV file.
   * @param distributor The distributor associated with the CSV data.
   * @returns A promise that resolves to an array of records.
   */
  async readCsvFile(filePath: string, distributor: Distributor) {
    return new Promise<any[]>((resolve, reject) => {
      try {
        const records = [];
        fs.createReadStream(filePath)
          .pipe(parse({ headers: true, delimiter: ';', ignoreEmpty: true }))
          .on('data', (row) => {
            const record = mapCsvToRecord(row, distributor);
            records.push(record);
          })
          .on('end', () => resolve(records))
          .on('error', (error) => reject(error));
      } catch (error) {
        this.loggerTxt.logError('CSV File not found', null, 'readCsvFile');
      }
    });
  }

  /**
   * Processes a single record from the CSV file.
   * @param record The record to be processed.
   * @param distributor The distributor associated with the record.
   * @param reportingMonth The reporting month for the record.
   * @param rowIndex The index of the row in the CSV file.
   * @param labelId The ID of the label to be linked (optional).
   * @param jobId The ID of the job (optional).
   */
  async processRecord(
    record: any,
    distributor: Distributor,
    reportingMonth: string,
    rowIndex: number,
    labelId?: number,
    jobId?: string,
  ) {
    try {
      const label = await this.findLabel(record.labelName);

      if (!label) {
        this.loggerTxt.logError(
          `Row ${rowIndex}: Label not found for label "${record.labelName}"`,
          jobId,
          'processRecord',
        );
        await this.unlinkedReportService.saveUnlinkedRecord(
          record,
          distributor,
          reportingMonth,
        );
        return;
      }

      if (labelId) {
        record.labelId = labelId;
      } else {
        if (!label.client) {
          this.loggerTxt.logError(
            `Row ${rowIndex}: Client not found for label "${record.labelName}"`,
            jobId,
            'processRecord',
          );
          await this.unlinkedReportService.saveUnlinkedRecord(
            record,
            distributor,
            reportingMonth,
          );
          return;
        }
        record.labelId = label.id;
      }

      const contract = await this.findContract(label.client.id);
      if (!contract || !contract.ppd) {
        this.loggerTxt.logError(
          `Row ${rowIndex}: Contract with valid PPD not found for client ID ${label.client.id}`,
          jobId,
          'processRecord',
        );
        await this.unlinkedReportService.saveUnlinkedRecord(
          record,
          distributor,
          reportingMonth,
        );
        return;
      }

      const { cmg_clientRate, cmg_netRevenue } = this.calculateRevenue(
        record,
        contract.ppd,
        distributor,
      );
      await this.saveReport(
        record,
        reportingMonth,
        distributor,
        cmg_clientRate,
        cmg_netRevenue,
      );
    } catch (error) {
      this.logger.error(`Error processing record: ${error.message}`);
      this.loggerTxt.logError(
        `General error processing record: ${error.message}`,
        jobId,
        'processRecord',
      );
    }
  }

  // ^ Methods

  /**
   * Finds a label by its name.
   * @param labelName The name of the label to be found.
   * @returns The label with its associated client.
   */
  private async findLabel(labelName: string) {
    return this.prisma.label.findUnique({
      where: { name: labelName },
      include: { client: true },
    });
  }

  /**
   * Finds a contract by the client ID.
   * @param clientId The ID of the client.
   * @returns The contract associated with the client.
   */
  private async findContract(clientId: number) {
    return this.prisma.contract.findFirst({
      where: {
        clientId,
        contractType: {
          in: [
            ContractType.DISTRIBUTION_EXCLUSIVE,
            ContractType.DISTRIBUTION_NONEXCLUSIVE,
          ],
        },
      },
    });
  }

  /**
   * Calculates the revenue for a record.
   * @param record The record to calculate revenue for.
   * @param ppd The PPD value for the contract.
   * @param distributor The distributor associated with the record.
   * @returns The calculated client rate and net revenue.
   */
  private calculateRevenue(record: any, ppd: number, distributor: Distributor) {
    const cmg_clientRate = ppd;
    let cmg_netRevenue;

    if (distributor === Distributor.BELIEVE) {
      cmg_netRevenue = record.netRevenue * (ppd / 100);
    } else if (distributor === Distributor.KONTOR) {
      cmg_netRevenue = record.royalties * (ppd / 100);
    } else {
      throw new Error(`Unsupported distributor: ${distributor}`);
    }

    if (cmg_netRevenue < 0) {
      cmg_netRevenue = record.netRevenue || record.royalties;
    }

    return { cmg_clientRate, cmg_netRevenue };
  }

  /**
   * Saves a report to the database.
   * @param record The record to be saved.
   * @param reportingMonth The reporting month for the record.
   * @param distributor The distributor associated with the record.
   * @param cmg_clientRate The client rate for the record.
   * @param cmg_netRevenue The net revenue for the record.
   */
  private async saveReport(
    record: any,
    reportingMonth: string,
    distributor: Distributor,
    cmg_clientRate: number,
    cmg_netRevenue: number,
  ) {
    if (distributor === Distributor.BELIEVE) {
      await this.prisma.believeRoyaltyReport.create({
        data: {
          ...record,
          reportingMonth,
          currency: 'USD',
          cmg_clientRate,
          cmg_netRevenue,
        },
      });
    } else if (distributor === Distributor.KONTOR) {
      await this.prisma.kontorRoyaltyReport.create({
        data: {
          ...record,
          reportingMonth,
          currency: 'EUR',
          cmg_clientRate,
          cmg_netRevenue,
        },
      });
    }
  }
}
