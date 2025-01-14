import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { Distributor } from '@prisma/client';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { AdminReportsHelperService } from './admin-reports-helper.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { S3Service } from 'src/common/services/s3.service';
import { UploadCsvDto } from '../dto/admin-upload-csv.dto';
import { pipeline } from 'stream';
import { promisify } from 'util';
import env from 'src/config/env.config';

const pipelineAsync = promisify(pipeline);

@Injectable()
export class AdminImportedReportsService {
  private readonly logger = new Logger(AdminImportedReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processRecordsService: AdminReportsHelperService,
    @InjectQueue('import-reports') private readonly importReportsQueue: Queue,
    private readonly s3Service: S3Service,
  ) {}

  async deleteImportedReports(
    reportingMonth: string,
    distributor: Distributor,
    deleteS3File: boolean,
  ) {
    const result = {
      deleted: 0,
      retained: 0,
      reasons: [],
    };

    try {
      let deleteResult;
      let retainedCount;

      if (distributor === Distributor.BELIEVE) {
        deleteResult = await this.prisma.believeRoyaltyReport.deleteMany({
          where: { reportingMonth },
        });
        result.deleted = deleteResult.count;

        retainedCount = await this.prisma.believeRoyaltyReport.count({
          where: {
            reportingMonth,
            OR: [
              { baseReportId: { not: null } },
              { userReportId: { not: null } },
            ],
          },
        });
      } else if (distributor === Distributor.KONTOR) {
        deleteResult = await this.prisma.kontorRoyaltyReport.deleteMany({
          where: { reportingMonth },
        });
        result.deleted = deleteResult.count;

        retainedCount = await this.prisma.kontorRoyaltyReport.count({
          where: {
            reportingMonth,
            OR: [
              { baseReportId: { not: null } },
              { userReportId: { not: null } },
            ],
          },
        });
      }

      result.retained = retainedCount;

      // Delete unlinked reports
      await this.processRecordsService.deleteUnlinkedReports(
        distributor,
        reportingMonth,
      );

      // Optionally delete the S3 file
      if (deleteS3File) {
        const importedReport =
          await this.prisma.importedRoyaltyReport.findFirst({
            where: { distributor, reportingMonth },
          });

        if (importedReport && importedReport.s3FileId) {
          try {
            await this.s3Service.deleteFile({ id: importedReport.s3FileId });
          } catch (error) {
            this.logger.warn(
              `S3 file not found for imported report ID: ${importedReport.id}`,
            );
          }
        } else {
          this.logger.warn(
            `Imported report or S3 file not found for ${distributor} ${reportingMonth}`,
          );
        }
      }

      // Delete the ImportedRoyaltyReport record
      await this.prisma.importedRoyaltyReport.deleteMany({
        where: { distributor, reportingMonth },
      });

      return {
        message: `Deleted ${result.deleted} reports, retained ${result.retained} reports.`,
      };
    } catch (error) {
      this.logger.error(`Failed to delete imported reports: ${error.message}`);
      throw new BadRequestException('Failed to delete imported reports.');
    }
  }

  async cancelJobs(reportingMonth: string, distributor: Distributor) {
    const jobs = await this.importReportsQueue.getJobs(['waiting', 'active']);
    const jobsToCancel = jobs.filter(
      (job) =>
        job.data.reportingMonth === reportingMonth &&
        job.data.distributor === distributor,
    );

    for (const job of jobsToCancel) {
      try {
        // Intenta eliminar el trabajo si no se puede cancelar
        await job.remove();

        // Si el trabajo está activo, moverlo a estado fallido
        if (job.isActive) {
          await job.moveToFailed({ message: 'Job cancelled' }, true);
        }

        this.logger.log(`Job ${job.id} cancelled successfully.`);
      } catch (error) {
        this.logger.error(`Failed to cancel job ${job.id}: ${error.message}`);
      }
    }

    return { message: `${jobsToCancel.length} job(s) cancelled.` };
  }

  async reprocessFile(reportingMonth: string, distributor: Distributor) {
    const s3Key = `import-reports/ImportReport_${distributor}_${reportingMonth}.csv`;
    const bucket = process.env.AWS_S3_BUCKET_NAME_ROYALTIES;

    try {
      const file = await this.s3Service.getFile({ bucket, key: s3Key });
      const tempFilePath = `/tmp/${s3Key.split('/').pop()}`;
      const fileStream = fs.createWriteStream(tempFilePath);

      const response = await fetch(file.url);
      const readableStream = response.body;

      await pipelineAsync(readableStream, fileStream);

      const uploadCsvDto: UploadCsvDto = {
        file: { path: tempFilePath } as Express.Multer.File,
        reportingMonth,
        distributor,
      };
      await this.processRecordsService.uploadCsvToQueue(uploadCsvDto);
    } catch (error) {
      this.logger.error(`Failed to reprocess file: ${error.message}`);
      throw new BadRequestException('File does not exist in S3.');
    }
  }

  async convertAndLinkOldReports(
    reportingMonth: string,
    distributor: Distributor,
  ) {
    this.logger.log(
      `Starting conversion and linking for ${distributor} ${reportingMonth}`,
    );

    try {
      const baseReports = await this.prisma.baseRoyaltyReport.findMany({
        where: { reportingMonth, distributor },
        include: {
          kontorReports: true,
          believeReports: true,
        },
      });

      if (baseReports.length === 0) {
        this.logger.warn(
          `No base reports found for ${distributor} ${reportingMonth}`,
        );
        return;
      }

      for (const baseReport of baseReports) {
        const importedReport = await this.prisma.importedRoyaltyReport.create({
          data: {
            distributor,
            reportingMonth,
            importStatus: 'COMPLETED',
            s3FileId: baseReport.s3FileId,
          },
        });

        if (distributor === Distributor.KONTOR) {
          await this.prisma.kontorRoyaltyReport.updateMany({
            where: { baseReportId: baseReport.id },
            data: { importedReportId: importedReport.id },
          });
        } else if (distributor === Distributor.BELIEVE) {
          await this.prisma.believeRoyaltyReport.updateMany({
            where: { baseReportId: baseReport.id },
            data: { importedReportId: importedReport.id },
          });
        }

        const oldS3Key = `ImportReport_${distributor}_${reportingMonth}.csv`;
        const newS3Key = `import-reports/ImportReport_${distributor}_${reportingMonth}.csv`;
        const bucket = env.AWS_S3_BUCKET_NAME_ROYALTIES;

        try {
          await this.s3Service.moveFile(bucket, oldS3Key, newS3Key);
        } catch (error) {
          this.logger.error(`Failed to move S3 file: ${error.message}`);
        }
      }

      this.logger.log(
        `Conversion and linking completed for ${distributor} ${reportingMonth}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to convert and link old reports: ${error.message}`,
      );
      throw new BadRequestException('Failed to convert and link old reports.');
    }
  }

  async getImportedReports(reportingMonth: string, distributor: Distributor) {
    return this.prisma.importedRoyaltyReport.findMany({
      where: { reportingMonth, distributor },
    });
  }

  async getAllImportedReports(distributor?: Distributor) {
    const filter = distributor ? { distributor } : {};
    return this.prisma.importedRoyaltyReport.findMany({
      where: filter,
      orderBy: { reportingMonth: 'desc' },
    });
  }
}
