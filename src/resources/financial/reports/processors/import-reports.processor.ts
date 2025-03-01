import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImportReportDto } from '../dto/admin-import-report.dto';
import { ProgressService } from 'src/common/services/progress.service';
import { S3Service } from 'src/common/services/s3.service';
import { AdminReportProcessCSVService } from '../services/admin/admin-report-process-csv.service';
import cleanUp from '../utils/cleanup.util';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import env from 'src/config/env.config';
import { ProcessingType } from '../enums/processing-type.enum';
import { BullJobLogger } from 'src/common/logger/BullJobLogger';
import { ContractType, Distributor } from '@prisma/client';
import { parse } from 'fast-csv';
import * as fs from 'fs';
import { decode } from 'html-entities';
import Decimal from 'decimal.js';
import { BadRequestException } from '@nestjs/common';
import { Buffer } from 'buffer';
import { mapCsvToRecord } from '../utils/csv-mapper.util';
import { LinkUnlinkedReportJobDto } from '../dto/link-unlinked-report.dto';

/**
 * Processor for handling royalty report import jobs
 *
 * This processor handles two main types of jobs:
 * - ImportReportCSV: Processing CSV files with royalty data from distributors
 * - LinkUnlinkedReport: Linking previously unlinked royalty records to specific labels
 */
@Processor('import-reports')
export class ImportReportsProcessor extends WorkerHost {
  private readonly redisKey = 'import-reports:progress';

  constructor(
    private readonly reportsService: AdminReportProcessCSVService,
    private readonly progressService: ProgressService,
    private readonly s3UploadService: S3Service,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  /**
   * Main processor method that handles different job types based on job name
   *
   * @param job - The job to be processed
   */
  async process(
    job: Job<ImportReportDto | LinkUnlinkedReportJobDto>,
  ): Promise<void> {
    const logger = new BullJobLogger(job.id, job.name);
    logger.log(`🚀 Starting job: ${job.name}`);

    try {
      switch (job.name) {
        case 'ImportReportCSV':
          await this.processImportReportCSV(job as Job<ImportReportDto>);
          break;
        case 'LinkUnlinkedReport':
          await this.processUnlinkedReportLinking(
            job as Job<LinkUnlinkedReportJobDto>,
          );
          break;
        default:
          logger.error(`Unknown job type: ${job.name}`);
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      const errorLogger = new BullJobLogger(job.id, job.name);
      errorLogger.error(`❌ Failed to process job: ${error.message}`);
      errorLogger.debug(`🛑 Stack Trace: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Processes a job that links unlinked royalty report records to a specific label
   *
   * @param job - The job containing unlinked report data
   */
  private async processUnlinkedReportLinking(
    job: Job<LinkUnlinkedReportJobDto>,
  ): Promise<void> {
    const { unlinkedReportId, labelId, reportingMonth, distributor } = job.data;
    const logger = new BullJobLogger(job.id, 'LinkUnlinkedReport');

    logger.log(
      `🔗 Starting linking of unlinked report ID: ${unlinkedReportId} to label ID: ${labelId}`,
    );

    try {
      // Get the unlinked report with its details
      const unlinkedReport =
        await this.getUnlinkedRecordWithDetails(unlinkedReportId);

      if (!unlinkedReport) {
        throw new Error(
          `UnlinkedReport with ID ${unlinkedReportId} not found.`,
        );
      }

      const recordCount = unlinkedReport.UnlinkedReportDetail.length;
      logger.log(
        `📋 Found unlinked report "${unlinkedReport.labelName}" with ${recordCount} records`,
      );

      // Process each record in the unlinked report
      for (let recordIndex = 0; recordIndex < recordCount; recordIndex++) {
        const recordDetail = unlinkedReport.UnlinkedReportDetail[recordIndex];
        const recordData = recordDetail.data as Record<string, any>;

        logger.log(`🔄 Processing record ${recordIndex + 1}/${recordCount}`);

        try {
          await this.processRoyaltyRecord(
            recordData,
            distributor,
            reportingMonth,
            ProcessingType.UNLINKED,
            recordIndex,
            labelId,
            job.id,
          );
          logger.log(`✅ Successfully processed record ${recordIndex + 1}`);
        } catch (error) {
          logger.error(
            `❌ Failed to process record ${recordIndex + 1}: ${error.message}`,
          );
          await this.saveRecordAsFailure(
            recordData,
            distributor,
            reportingMonth,
            error.message,
          );
        }
      }

      // Delete the unlinked report as it's now processed
      logger.log(`🗑️ Deleting unlinked report ID: ${unlinkedReportId}`);
      await this.deleteUnlinkedReport(unlinkedReportId);
      logger.log(`✅ Linking process complete - All records processed`);
    } catch (error) {
      logger.error(`❌ Failed to link unlinked report: ${error.message}`);
      logger.debug(`🛑 Stack Trace: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Processes a CSV import job for royalty reports
   *
   * @param job - The job containing CSV file import data
   */
  private async processImportReportCSV(
    job: Job<ImportReportDto>,
  ): Promise<void> {
    const { filePath, reportingMonth, distributor, importReportId } = job.data;
    const logger = new BullJobLogger(job.id, 'ImportReportCSV');

    const bucket = env.AWS_S3_BUCKET_NAME_ROYALTIES;
    const s3Key = `import-reports/ImportReport_${distributor}_${reportingMonth}.csv`;

    logger.log(`🚀 Starting processing for file: ${filePath}`);

    try {
      // Update status to ACTIVE in database
      logger.log(`🔄 Updating import status to ACTIVE`);
      await this.prisma.importedRoyaltyReport.update({
        where: { id: importReportId },
        data: { importStatus: 'ACTIVE' },
      });

      // Read and parse the CSV file
      logger.log(`📥 Reading CSV file: ${filePath}`);
      const records = await this.parseCSVFile(filePath, distributor, job.id);

      if (records.length === 0) {
        throw new Error(`CSV file contains no valid records`);
      }

      // Resume from last processed index if job was interrupted
      const lastProcessedIndex =
        await this.progressService.getLastProcessedIndex(this.redisKey, job.id);
      logger.log(`🔄 Resuming from record #${lastProcessedIndex + 1}`);

      // Process each record in the CSV
      for (
        let rowIndex = lastProcessedIndex;
        rowIndex < records.length;
        rowIndex++
      ) {
        const record = records[rowIndex];
        logger.debug(`📌 Processing row: ${rowIndex + 1} of ${records.length}`);

        await this.processRoyaltyRecord(
          record,
          distributor,
          reportingMonth,
          ProcessingType.IMPORT,
          rowIndex,
          undefined, // Label ID is not needed for import
          job.id,
          importReportId,
        );

        // Update progress
        await this.progressService.saveProgress(
          this.redisKey,
          job.id,
          rowIndex + 1,
        );
        this.progressService.calculateAndUpdateProgress(
          job,
          records.length,
          rowIndex + 1,
        );
      }

      logger.log(
        `✅ CSV Processing complete! ${records.length} records processed`,
      );

      // Upload the file to S3 for archiving
      logger.log(`📤 Uploading processed file to S3`);
      const s3File = await this.s3UploadService.uploadFile(
        bucket,
        s3Key,
        filePath,
      );

      // Update database with completion status and S3 reference
      logger.log(`🗄️ Updating import record with S3 file ID: ${s3File.id}`);
      await this.prisma.importedRoyaltyReport.update({
        where: { id: importReportId },
        data: {
          importStatus: 'COMPLETED',
          s3File: { connect: { id: s3File.id } },
        },
      });

      // Clean up temporary files
      logger.log(`🧹 Cleaning up temporary files`);
      await cleanUp(filePath, logger);
    } catch (error) {
      logger.error(`❌ Import failed: ${error.message}`);
      logger.debug(`🛑 Stack Trace: ${error.stack}`);

      // Delete imported report record on failure
      logger.warn(`⚠️ Deleting import entry due to failure`);

      try {
        await this.prisma.importedRoyaltyReport.delete({
          where: { id: importReportId },
        });
      } catch (deleteError) {
        logger.error(
          `❌ Failed to delete import entry: ${deleteError.message}`,
        );
      }
    }
  }

  /**
   * Parses a CSV file and maps its content to royalty report records
   *
   * @param filePath - Path to the CSV file
   * @param distributor - The distributor source of the file
   * @param jobId - The job ID for logging
   * @returns An array of royalty report records
   */
  async parseCSVFile(
    filePath: string,
    distributor: Distributor,
    jobId: string,
  ) {
    const logger = new BullJobLogger(jobId, 'ParseCSVFile');

    return new Promise<any[]>((resolve, reject) => {
      try {
        const records = [];
        fs.createReadStream(filePath, { encoding: 'utf8' })
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
          .on('end', () => {
            logger.log(
              `✅ Successfully parsed ${records.length} records from CSV`,
            );
            resolve(records);
          })
          .on('error', (error) => {
            logger.error(`❌ Error parsing CSV: ${error.message}`);
            reject(error);
          });
      } catch (error) {
        logger.error(`❌ CSV File access error: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Processes a single royalty record, finding or associating it with appropriate
   * label, contract, and calculating revenue
   *
   * @param record - The royalty record to process
   * @param distributor - The distributor source
   * @param reportingMonth - The report month in YYYY-MM format
   * @param processingType - Whether this is an import or linking of unlinked record
   * @param rowIndex - The index of the record in the original data source
   * @param labelId - Optional label ID for UNLINKED processing
   * @param jobId - The job ID for logging
   * @param importReportId - Optional import report ID to associate with
   */
  async processRoyaltyRecord(
    record: any,
    distributor: Distributor,
    reportingMonth: string,
    processingType: ProcessingType,
    rowIndex?: number,
    labelId?: number,
    jobId?: string,
    importReportId?: number,
  ) {
    const logger = new BullJobLogger(jobId, 'ProcessRoyaltyRecord');
    logger.log(`🔍 Processing royalty record #${rowIndex + 1}`);

    try {
      // Step 1: Find the appropriate label
      let label;
      if (processingType === ProcessingType.UNLINKED) {
        label = await this.resolveLabelById(labelId, logger);
      } else if (processingType === ProcessingType.IMPORT) {
        label = await this.resolveLabelByName(
          record.labelName,
          distributor,
          logger,
        );

        // If no label found, save as unlinked and stop processing
        if (!label) {
          logger.warn(
            `⚠️ Record #${rowIndex + 1}: No matching label found for "${record.labelName}"`,
          );
          await this.saveUnlinkedRecord(record, distributor, reportingMonth);
          logger.log(`📝 Record saved as unlinked for future processing`);
          return;
        }
      }

      // Step 2: Find the contract for the client
      logger.log(`🔍 Finding contract for client ID: ${label.client.id}`);
      const contract = await this.findClientContract(label.client.id);

      // Validate contract has PPD (Percentage Per Distribution)
      // Modified to handle PPD value of 0
      if (contract?.ppd === null || contract?.ppd === undefined) {
        logger.warn(
          `⚠️ Record #${rowIndex + 1}: No valid contract with PPD found for client ID ${label.client.id}`,
        );
        await this.saveRecordAsFailure(
          record,
          distributor,
          reportingMonth,
          'No valid contract with PPD found for client',
        );
        return;
      }
      logger.log(`✅ Found contract with PPD: ${contract.ppd}%`);

      // Step 3: Calculate revenue based on PPD and distributor
      logger.log(`🧮 Calculating client revenue`);
      const { cmg_clientRate, cmg_netRevenue } = this.calculateClientRevenue(
        record,
        contract.ppd,
        distributor,
      );
      logger.log(
        `📊 Revenue calculation: ${cmg_netRevenue} (${cmg_clientRate}% of total)`,
      );

      // Step 4: Save the report to appropriate table in database
      logger.log(`💾 Saving royalty report to database`);
      await this.saveRoyaltyReport(
        record,
        reportingMonth,
        distributor,
        cmg_clientRate,
        cmg_netRevenue,
        label.id,
        importReportId,
      );
      logger.log(`✅ Record #${rowIndex + 1} successfully processed and saved`);
    } catch (error) {
      logger.error(
        `❌ Record #${rowIndex + 1}: Processing failed - ${error.message}`,
      );

      try {
        await this.saveRecordAsFailure(
          record,
          distributor,
          reportingMonth,
          error.message,
        );
        logger.log(`📝 Failed record saved for review`);
      } catch (err) {
        logger.error(`❌ Error saving failed record: ${err.message}`);
      }
    }
  }

  /**
   * Resolves a label by its ID
   *
   * @param labelId - The label ID to look up
   * @param logger - Logger for tracing the process
   * @returns The found label with its client information
   * @throws BadRequestException if label is not found or ID is missing
   */
  private async resolveLabelById(labelId: number, logger: BullJobLogger) {
    logger.log(`🔍 Looking up label by ID: ${labelId}`);

    if (!labelId) {
      throw new BadRequestException(
        'Label ID is required for unlinked records',
      );
    }

    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      include: { client: true },
    });

    if (!label) {
      throw new BadRequestException(`Label with ID ${labelId} not found`);
    }

    logger.log(`✅ Found label: "${label.name}" (ID: ${label.id})`);
    return label;
  }

  /**
   * Resolves a label by its name, with appropriate handling for different distributors
   *
   * @param labelName - The label name to look up
   * @param distributor - The distributor to consider for search logic
   * @param logger - Logger for tracing the process
   * @returns The found label with its client information, or null if not found
   */
  private async resolveLabelByName(
    labelName: string,
    distributor: Distributor,
    logger: BullJobLogger,
  ) {
    let labelNameClean: string;

    try {
      labelNameClean = Buffer.from(labelName, 'utf8').toString();
      logger.log(`🔍 Looking up label by name: "${labelNameClean}"`);
    } catch (error) {
      logger.error(`❌ Error converting label name encoding: ${error.message}`);
      throw error;
    }

    try {
      let label;

      // Different search criteria based on distributor
      if (distributor === Distributor.BELIEVE) {
        label = await this.prisma.label.findFirst({
          where: {
            name: {
              equals: labelNameClean,
              mode: 'insensitive', // Case-insensitive for BELIEVE
            },
          },
          include: { client: true },
        });
      } else {
        label = await this.prisma.label.findFirst({
          where: {
            name: {
              equals: labelNameClean, // Case-sensitive for others
            },
          },
          include: { client: true },
        });
      }

      if (label) {
        logger.log(`✅ Found label: "${label.name}" (ID: ${label.id})`);
      } else {
        logger.warn(`⚠️ No label found with name: "${labelNameClean}"`);
      }

      return label;
    } catch (error) {
      logger.error(`❌ Error during label lookup: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finds a contract for a client that has a valid PPD for royalty calculation
   *
   * @param clientId - The client ID to find contracts for
   * @returns The first valid contract with PPD, or null if none found
   */
  private async findClientContract(clientId: number) {
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
   * Calculates client revenue based on royalty record, PPD and distributor
   *
   * @param record - The royalty record containing revenue data
   * @param ppd - Percentage Per Distribution from client contract
   * @param distributor - The distributor to determine calculation method
   * @returns Object containing client rate and calculated net revenue
   */
  private calculateClientRevenue(
    record: any,
    ppd: number,
    distributor: Distributor,
  ) {
    const cmg_clientRate = ppd; // Client's percentage rate
    let cmg_netRevenue: number;

    // Calculate revenue based on distributor-specific fields
    if (distributor === Distributor.BELIEVE) {
      cmg_netRevenue = new Decimal(record.netRevenue)
        .mul(ppd)
        .div(100)
        .toDP(10)
        .toNumber();
    } else if (distributor === Distributor.KONTOR) {
      cmg_netRevenue = new Decimal(record.royalties)
        .mul(ppd)
        .div(100)
        .toDP(10)
        .toNumber();
    } else {
      throw new Error(`Unsupported distributor: ${distributor}`);
    }

    // Fallback if calculation produces negative revenue
    if (cmg_netRevenue < 0) {
      cmg_netRevenue =
        parseFloat(record.netRevenue) || parseFloat(record.royalties);
    }

    return { cmg_clientRate, cmg_netRevenue };
  }

  /**
   * Saves a royalty report to the appropriate database table
   *
   * @param record - The royalty record to save
   * @param reportingMonth - The report month in YYYY-MM format
   * @param distributor - The distributor source
   * @param cmg_clientRate - The client's rate percentage
   * @param cmg_netRevenue - The calculated net revenue
   * @param labelId - The label ID to associate with the report
   * @param importReportId - Optional import report ID to associate with
   */
  private async saveRoyaltyReport(
    record: any,
    reportingMonth: string,
    distributor: Distributor,
    cmg_clientRate: number,
    cmg_netRevenue: number,
    labelId: number,
    importReportId?: number,
  ) {
    // Prepare base data common to all distributors
    const data = {
      ...record,
      reportingMonth,
      cmg_clientRate: new Decimal(cmg_clientRate),
      cmg_netRevenue: new Decimal(cmg_netRevenue),
      label: { connect: { id: labelId } },
    };

    // Add distributor-specific fields
    if (distributor === Distributor.BELIEVE) {
      data.currency = 'USD';
    } else if (distributor === Distributor.KONTOR) {
      data.currency = 'EUR';
    }

    // Add import report reference if provided
    if (importReportId) {
      data.importedReport = { connect: { id: importReportId } };
    }

    // Save to the appropriate distributor-specific table
    if (distributor === Distributor.BELIEVE) {
      await this.prisma.believeRoyaltyReport.create({ data });
    } else if (distributor === Distributor.KONTOR) {
      await this.prisma.kontorRoyaltyReport.create({ data });
    }
  }

  /**
   * Saves a record that could not be processed as a failure for later review
   *
   * @param record - The royalty record that failed
   * @param distributor - The distributor source
   * @param reportingMonth - The report month in YYYY-MM format
   * @param failReason - The reason for the failure
   */
  async saveRecordAsFailure(
    record: any,
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
   * Saves a record as unlinked when no matching label is found
   *
   * @param record - The royalty record to save as unlinked
   * @param distributor - The distributor source
   * @param reportingMonth - The report month in YYYY-MM format
   */
  async saveUnlinkedRecord(
    record: any,
    distributor: Distributor,
    reportingMonth: string,
  ) {
    // Check if there's already an unlinked report for this label name
    const unlinkedReport = await this.prisma.unlinkedReport.findFirst({
      where: {
        labelName: record.labelName,
        reportingMonth,
        distributor,
      },
    });

    if (unlinkedReport) {
      // Update existing unlinked report with new detail
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
      // Create new unlinked report with first detail
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

  /**
   * Retrieves an unlinked report with all its details
   *
   * @param unlinkedReportId - The ID of the unlinked report
   * @returns The unlinked report with its details
   */
  async getUnlinkedRecordWithDetails(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.findUnique({
      where: { id: unlinkedReportId },
      include: { UnlinkedReportDetail: true },
    });
  }

  /**
   * Deletes an unlinked report after it has been processed
   *
   * @param unlinkedReportId - The ID of the unlinked report to delete
   * @returns The delete operation result
   */
  async deleteUnlinkedReport(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.delete({
      where: { id: unlinkedReportId },
    });
  }
}
