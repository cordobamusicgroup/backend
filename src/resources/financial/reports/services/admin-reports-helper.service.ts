// src/resources/financial/reports/reports.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ContractType, Distributor } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bull';
import { mapCsvToRecord } from '../utils/csv-mapper.util';
import { parse } from 'fast-csv';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { UploadCsvDto } from '../dto/admin-upload-csv.dto';
import { decode } from 'html-entities';
import Decimal from 'decimal.js';
import { LinkUnlinkedReportDto } from '../dto/admin-link-unlinked-report.dto';
import { Buffer } from 'buffer';
import dayjs from 'dayjs';
import { S3Service } from 'src/common/services/s3.service';

@Injectable()
export class AdminReportsHelperService {
  private readonly logger = new Logger(AdminReportsHelperService.name);

  constructor(
    @InjectQueue('import-reports') private importReportsQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly loggerTxt: LoggerTxtService,
    private readonly s3Service: S3Service,
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
      // Check if there are existing jobs in progress for the given distributor and reporting month
      await this.validateNoJobInProgress(reportingMonth, distributor);

      // Check if there are existing reports for the given distributor and reporting month
      if (await this.checkForExistingReports(distributor, reportingMonth)) {
        throw new BadRequestException(
          'There are already records for the given distributor and reporting month.',
        );
      }

      // Create an ImportedRoyaltyReport record
      const importedReport = await this.prisma.importedRoyaltyReport.create({
        data: {
          distributor,
          reportingMonth,
          importStatus: 'PENDING',
        },
      });

      // Add the CSV file to the processing queue
      await this.importReportsQueue.add('parse-csv', {
        filePath: tempFilePath,
        reportingMonth,
        distributor,
        importReportId: importedReport.id,
      });

      return {
        message: 'CSV file queued for processing.',
        distributor,
        reportingMonth,
      };
    } catch (error) {
      this.logger.error(`Failed to queue CSV for processing: ${error.message}`);
      throw error;
    }
  }

  async validateNoJobInProgress(
    reportingMonth: string,
    distributor: Distributor,
  ) {
    const existingJobs = await this.importReportsQueue.getJobs([
      'waiting',
      'active',
    ]);
    const isJobInProgress = existingJobs.some(
      (job) =>
        job.data.reportingMonth === reportingMonth &&
        job.data.distributor === distributor,
    );

    if (isJobInProgress) {
      throw new BadRequestException(
        'There is already a job in progress for the same reporting month and distributor.',
      );
    }
  }

  /**
   * Checks if there are existing reports for the given distributor and reporting month.
   * @param distributor The distributor to check.
   * @param reportingMonth The reporting month to check.
   * @returns A boolean indicating whether there are existing reports.
   */
  private async checkForExistingReports(
    distributor: Distributor,
    reportingMonth: string,
  ): Promise<boolean> {
    if (!reportingMonth) {
      throw new BadRequestException('Reporting month must be provided.');
    }

    let existingReport = null;
    if (distributor === Distributor.KONTOR) {
      existingReport = await this.prisma.kontorRoyaltyReport.findFirst({
        where: { reportingMonth },
      });
    } else if (distributor === Distributor.BELIEVE) {
      existingReport = await this.prisma.believeRoyaltyReport.findFirst({
        where: { reportingMonth },
      });
    }
    return !!existingReport;
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
        fs.createReadStream(filePath, { encoding: 'utf8' }) // Ensure UTF-8 encoding
          .pipe(parse({ headers: true, delimiter: ';', ignoreEmpty: true }))
          .on('data', (row) => {
            // Decode HTML entities in each field
            for (const key in row) {
              if (row.hasOwnProperty(key)) {
                row[key] = decode(row[key]);
              }
            }
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
   * @param importReportId The ID of the import report (optional).
   */
  async processRecord(
    record: any,
    distributor: Distributor,
    reportingMonth: string,
    rowIndex: number,
    labelId?: number,
    jobId?: string,
    importReportId?: number,
  ) {
    try {
      let label;
      if (labelId) {
        // Find label by ID if provided
        label = await this.findLabelById(labelId);
        if (!label) {
          throw new Error(`Label with ID ${labelId} not found.`);
        }
      } else {
        // Normalize and convert the label name from the CSV to UTF-8
        const utf8LabelName = Buffer.from(record.labelName, 'utf8').toString();
        // Find label by name if ID is not provided
        label = await this.findLabelByName(utf8LabelName, distributor);
        if (!label) {
          this.loggerTxt.logError(
            `Row ${rowIndex}: Label not found for label "${record.labelName}"`,
            jobId,
            'processRecord',
          );
          await this.saveUnlinkedRecord(record, distributor, reportingMonth);
          return;
        }
      }

      // Find contract associated with the label's client
      const contract = await this.findContract(label.client.id);
      if (contract == null || contract.ppd == undefined) {
        this.loggerTxt.logError(
          `Row ${rowIndex}: Contract with valid PPD not found for client ID ${label.client.id}`,
          jobId,
          'processRecord',
        );
        await this.saveUnlinkedRecord(record, distributor, reportingMonth);
        return;
      }

      // Format reportingMonth for BELIEVE
      if (distributor === Distributor.BELIEVE) {
        record.reportingMonth = dayjs(record.reportingMonth).format('YYYYMM');
      }

      // Calculate revenue based on the contract's PPD and distributor
      const { cmg_clientRate, cmg_netRevenue } = this.calculateRevenue(
        record,
        contract.ppd,
        distributor,
      );

      // Save the processed report to the database
      await this.saveReport(
        record,
        reportingMonth,
        distributor,
        cmg_clientRate,
        cmg_netRevenue,
        label.id,
        importReportId, // Link to importReportId
      );
    } catch (error) {
      this.loggerTxt.logError(
        `Row ${rowIndex}: Failed to process record - ${error.message}`,
        jobId,
        'processRecord',
      );
      await this.saveUnlinkedRecord(record, distributor, reportingMonth);
    }
  }

  // ^ Methods

  /**
   * Finds a label by its name.
   * @param labelName The name of the label to be found.
   * @returns The label with its associated client.
   */
  private async findLabelByName(labelName: string, distributor: Distributor) {
    if (distributor === Distributor.BELIEVE) {
      return this.prisma.label.findFirst({
        where: {
          name: {
            contains: labelName,
            mode: 'insensitive',
          },
        },
        include: { client: true },
      });
    } else {
      return this.prisma.label.findFirst({
        where: {
          name: {
            contains: labelName,
          },
        },
        include: { client: true },
      });
    }
  }

  /**
   * Finds a label by its ID.
   * @param labelId The ID of the label to be found.
   * @returns The label with its associated client.
   */
  private async findLabelById(labelId: number) {
    return this.prisma.label.findUnique({
      where: { id: labelId },
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
    const cmg_clientRate = ppd; // Float
    let cmg_netRevenue: number;

    if (distributor === Distributor.BELIEVE) {
      cmg_netRevenue = new Decimal(record.netRevenue)
        .mul(ppd)
        .div(100)
        .toDP(10) // Ensure full decimal precision
        .toNumber();
    } else if (distributor === Distributor.KONTOR) {
      cmg_netRevenue = new Decimal(record.royalties)
        .mul(ppd)
        .div(100)
        .toDP(10) // Ensure full decimal precision
        .toNumber();
    } else {
      throw new Error(`Unsupported distributor: ${distributor}`);
    }

    if (cmg_netRevenue < 0) {
      cmg_netRevenue =
        parseFloat(record.netRevenue) || parseFloat(record.royalties);
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
   * @param importReportId The ID of the import report (optional).
   */
  private async saveReport(
    record: any,
    reportingMonth: string,
    distributor: Distributor,
    cmg_clientRate: number,
    cmg_netRevenue: number,
    labelId: number,
    importReportId?: number,
  ) {
    if (distributor === Distributor.BELIEVE) {
      await this.prisma.believeRoyaltyReport.create({
        data: {
          ...record,
          reportingMonth,
          currency: 'USD',
          cmg_clientRate: new Decimal(cmg_clientRate),
          cmg_netRevenue: new Decimal(cmg_netRevenue),
          unitPrice: new Decimal(record.unitPrice),
          mechanicalFee: new Decimal(record.mechanicalFee),
          grossRevenue: new Decimal(record.grossRevenue),
          clientShareRate: new Decimal(record.clientShareRate),
          netRevenue: new Decimal(record.netRevenue),
          label: { connect: { id: labelId } },
          importReport: { connect: { id: importReportId } },
        },
      });
    } else if (distributor === Distributor.KONTOR) {
      await this.prisma.kontorRoyaltyReport.create({
        data: {
          ...record,
          reportingMonth,
          currency: 'EUR',
          cmg_clientRate: new Decimal(cmg_clientRate),
          cmg_netRevenue: new Decimal(cmg_netRevenue),
          royalties: new Decimal(record.royalties),
          label: { connect: { id: labelId } },
          importedReport: { connect: { id: importReportId } },
        },
      });
    }
  }

  /**
   * Deletes unlinked reports for a given reporting month and distributor.
   * @param reportingMonth The reporting month for the reports.
   * @param distributor The distributor associated with the reports.
   * @returns An object indicating the number of deleted and retained reports.
   */
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
      await this.deleteUnlinkedReports(distributor, reportingMonth);

      return result;
    } catch (error) {
      this.logger.error(`Failed to delete imported reports: ${error.message}`);
      throw new BadRequestException('Failed to delete imported reports.');
    }
  }

  /**
   * Links unlinked reports by processing them with the provided label ID.
   * @param linkUnlinkedReportDto The DTO containing the unlinked report ID and label ID.
   */
  async linkUnlinkedReport(linkUnlinkedReportDto: LinkUnlinkedReportDto) {
    const { unlinkedReportId, labelId } = linkUnlinkedReportDto;

    this.logger.log(
      `Starting linking process for UnlinkedReport ID: ${unlinkedReportId}`,
    );

    const unlinkedReport = await this.getUnlinkedRecords(unlinkedReportId);
    if (!unlinkedReport) {
      this.logger.error(
        `UnlinkedReport with ID ${unlinkedReportId} not found.`,
      );
      throw new BadRequestException(
        `UnlinkedReport with ID ${unlinkedReportId} not found.`,
      );
    }

    const { distributor, reportingMonth, UnlinkedReportDetail } =
      unlinkedReport;
    for (let i = 0; i < UnlinkedReportDetail.length; i++) {
      const record_detail = UnlinkedReportDetail[i];
      const records_detailData = record_detail.data as Record<string, any>;

      try {
        // Process the record with the provided labelId
        await this.processRecord(
          records_detailData,
          distributor,
          reportingMonth,
          i,
          labelId,
        );
      } catch (error) {
        this.logger.error(` Error processing row ${i}: ${error.message}`);
      }
    }

    this.logger.log(`Linking complete`);
    await this.deleteUnlinkedReport(unlinkedReportId);
  }

  /**
   * Retrieves unlinked records by their ID.
   * @param unlinkedReportId The ID of the unlinked report.
   * @returns The unlinked report with its details.
   */
  async getUnlinkedRecords(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.findUnique({
      where: { id: unlinkedReportId },
      include: { UnlinkedReportDetail: true },
    });
  }

  /**
   * Retrieves all unlinked reports.
   * @returns An array of all unlinked reports.
   */
  async getAllUnlinkedReports() {
    return this.prisma.unlinkedReport.findMany({});
  }

  /**
   * Deletes an unlinked report by its ID.
   * @param unlinkedReportId The ID of the unlinked report to be deleted.
   */
  async deleteUnlinkedReport(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.delete({
      where: { id: unlinkedReportId },
    });
  }

  /**
   * Deletes unlinked reports for a given distributor and reporting month.
   * @param distributor The distributor associated with the reports.
   * @param reportingMonth The reporting month for the reports.
   */
  async deleteUnlinkedReports(
    distributor: Distributor,
    reportingMonth: string,
  ) {
    return this.prisma.unlinkedReport.deleteMany({
      where: {
        distributor,
        reportingMonth,
      },
    });
  }

  /**
   * Saves an unlinked record to the database.
   * @param record The record to be saved.
   * @param distributor The distributor associated with the record.
   * @param reportingMonth The reporting month for the record.
   */
  async saveUnlinkedRecord(
    record: any,
    distributor: Distributor,
    reportingMonth: string,
  ) {
    const unlinkedReport = await this.prisma.unlinkedReport.findFirst({
      where: {
        labelName: record.labelName,
        reportingMonth,
        distributor,
      },
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
