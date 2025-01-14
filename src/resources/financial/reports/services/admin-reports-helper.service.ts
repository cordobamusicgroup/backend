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
import { Buffer } from 'buffer';
import { S3Service } from 'src/common/services/s3.service';
import { ProcessingType } from '../enums/processing-type.enum';

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

  async processRecord(
    record: RoyaltyReportRecordType,
    distributor: Distributor,
    reportingMonth: string,
    processingType: ProcessingType,
    rowIndex?: number,
    labelId?: number,
    jobId?: string,
    importReportId?: number,
  ) {
    try {
      /**
       * Find label by name or ID based on processing type.
       */
      let label;
      if (processingType === ProcessingType.UNLINKED) {
        if (!labelId) {
          throw new BadRequestException(
            'labelId is required when processing as UNLINKED',
          );
        }
        label = await this.findLabelById(labelId);
        if (!label) {
          throw new BadRequestException(`Label with ID ${labelId} not found.`);
        }
      } else if (processingType === ProcessingType.IMPORT) {
        const labelNameUTF8 = Buffer.from(record.labelName, 'utf8').toString();
        label = await this.findLabelByName(labelNameUTF8, distributor);
        if (!label) {
          this.loggerTxt.logError(
            `Row ${rowIndex}: Label not found for label "${record.labelName}", saving as unlinked`,
            jobId,
            'ProcessReportRecord',
          );
          await this.saveUnlinkedRecord(record, distributor, reportingMonth);
          return; // Stop processing if label not found
        }
      }
      /**
       * Find contract associated with the label's client
       */
      const contract = await this.findContract(label.client.id);
      if (contract == null || contract.ppd == undefined) {
        this.loggerTxt.logError(
          `Row ${rowIndex}: Contract with valid PPD not found for client ID ${label.client.id}, saving failed record`,
          jobId,
          'ProcessReportRecord',
        );
        await this.saveFailedRecord(
          record,
          distributor,
          reportingMonth,
          'Contract with valid PPD not found for client ID',
        );

        return;
      }
      /**
       * Calculate revenue based on the contract's PPD and distributor
       */
      const { cmg_clientRate, cmg_netRevenue } = this.calculateRevenue(
        record,
        contract.ppd,
        distributor,
      );
      /**
       * Save the processed report to the database
       */
      await this.saveReport(
        record,
        reportingMonth,
        distributor,
        cmg_clientRate,
        cmg_netRevenue,
        label.id,
        importReportId,
      );
    } catch (error) {
      this.logger.error(
        `Row ${rowIndex}: Failed to process record - ${error.message}`,
        jobId,
        'ProcessReportRecord',
      );
      this.loggerTxt.logError(
        `Row ${rowIndex}: Failed to process record - ${error.message}`,
        jobId,
        'ProcessReportRecord',
      );
      await this.saveFailedRecord(
        record,
        distributor,
        reportingMonth,
        error.message,
      );
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
    const data = {
      ...record,
      reportingMonth,
      cmg_clientRate: new Decimal(cmg_clientRate),
      cmg_netRevenue: new Decimal(cmg_netRevenue),
      label: { connect: { id: labelId } },
    };

    if (distributor === Distributor.BELIEVE) {
      data.currency = 'USD';
    } else if (distributor === Distributor.KONTOR) {
      data.currency = 'EUR';
    }

    if (importReportId) {
      data.importedReport = { connect: { id: importReportId } };
    }

    if (distributor === Distributor.BELIEVE) {
      await this.prisma.believeRoyaltyReport.create({ data });
    } else if (distributor === Distributor.KONTOR) {
      await this.prisma.kontorRoyaltyReport.create({ data });
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

  async saveFailedRecord(
    record: RoyaltyReportRecordType,
    distributor: Distributor,
    reportingMonth: string,
    failReason: string,
  ) {
    await this.prisma.failedReportDetail.create({
      data: {
        reportingMonth,
        distributor,
        failedReason: failReason,
        data: JSON.parse(JSON.stringify(record)),
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
