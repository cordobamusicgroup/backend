import {
  Controller,
  Post,
  UploadedFile,
  Body,
  BadRequestException,
  UseInterceptors,
  Delete,
  Query,
  Get,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { Distributor, Role } from 'src/generated/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadCsvDto } from '../../dto/admin-upload-csv.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AdminImportedReportsService } from '../../services/admin/admin-imported-reports.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ImportedReportDto } from '../../dto/admin-get-imported-reports.dto';

/**
 * Controller responsible for handling administrative operations related to importing financial reports.
 * Provides endpoints for uploading, deleting, and managing report imports from different distributors.
 * All endpoints require ADMIN role permissions.
 */
@Controller('admin/import')
@Roles(Role.ADMIN)
export class AdminImportReportsController {
  constructor(
    private readonly importedReportsService: AdminImportedReportsService,
    @InjectQueue('import-reports') private readonly importReportsQueue: Queue,
  ) {}

  /**
   * Uploads and processes a Kontor CSV report file
   *
   * @param file - The uploaded CSV file containing Kontor report data
   * @param reportingMonth - The reporting month in YYYYMM format
   * @returns A response indicating that the file has been queued for processing
   * @throws BadRequestException if the reportingMonth format is invalid
   */
  @Post('kontor')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadKontorCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('reportingMonth') reportingMonth: string,
  ) {
    if (!reportingMonth || !/^(\d{4})(0[1-9]|1[0-2])$/.test(reportingMonth)) {
      throw new BadRequestException(
        'Invalid reportingMonth format. Expected format is YYYYMM.',
      );
    }

    const uploadCsvDto: UploadCsvDto = {
      file,
      reportingMonth,
      distributor: Distributor.KONTOR,
    };
    return this.importedReportsService.uploadCsvToQueue(uploadCsvDto);
  }

  /**
   * Uploads and processes a Believe CSV report file
   *
   * @param file - The uploaded CSV file containing Believe report data
   * @param reportingMonth - The reporting month in YYYYMM format
   * @returns A response indicating that the file has been queued for processing
   * @throws BadRequestException if the reportingMonth format is invalid
   */
  @Post('believe')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadBelieveCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('reportingMonth') reportingMonth: string,
  ) {
    if (!reportingMonth || !/^(\d{4})(0[1-9]|1[0-2])$/.test(reportingMonth)) {
      throw new BadRequestException(
        'Invalid reportingMonth format. Expected format is YYYYMM.',
      );
    }

    const uploadCsvDto: UploadCsvDto = {
      file,
      reportingMonth,
      distributor: Distributor.BELIEVE,
    };
    return this.importedReportsService.uploadCsvToQueue(uploadCsvDto);
  }

  /**
   * Deletes imported reports for a specific reporting month and distributor
   *
   * @param reportingMonth - The reporting month in YYYYMM format
   * @param distributor - The distributor type (e.g., KONTOR, BELIEVE)
   * @param deleteS3File - Whether to delete the associated S3 file
   * @returns Information about the deletion operation
   * @throws BadRequestException if reportingMonth format or distributor is invalid
   */
  @Delete('delete')
  async deleteImportedReports(
    @Body('reportingMonth') reportingMonth: string,
    @Body('distributor') distributor: Distributor,
    @Query('deleteS3File') deleteS3File: boolean,
  ) {
    if (!reportingMonth || !/^(\d{4})(0[1-9]|1[0-2])$/.test(reportingMonth)) {
      throw new BadRequestException(
        'Invalid reportingMonth format. Expected format is YYYYMM.',
      );
    }

    if (!distributor || !Object.values(Distributor).includes(distributor)) {
      throw new BadRequestException('Invalid distributor.');
    }

    return this.importedReportsService.deleteImportedReports(
      reportingMonth,
      distributor,
      deleteS3File,
    );
  }

  /**
   * Cancels ongoing import jobs for a specific reporting month and distributor
   *
   * @param reportingMonth - The reporting month in YYYYMM format
   * @param distributor - The distributor type (e.g., KONTOR, BELIEVE)
   * @returns A message indicating the number of jobs cancelled
   * @throws BadRequestException if reportingMonth format or distributor is invalid
   */
  @Delete('cancel')
  async cancelJobs(
    @Body('reportingMonth') reportingMonth: string,
    @Body('distributor') distributor: Distributor,
  ) {
    if (!reportingMonth || !/^(\d{4})(0[1-9]|1[0-2])$/.test(reportingMonth)) {
      throw new BadRequestException(
        'Invalid reportingMonth format. Expected format is YYYYMM.',
      );
    }

    if (!distributor || !Object.values(Distributor).includes(distributor)) {
      throw new BadRequestException('Invalid distributor.');
    }

    return this.importedReportsService.cancelJobs(reportingMonth, distributor);
  }

  /**
   * Retrieves all imported reports, optionally filtered by distributor
   * Returns reports sorted by reportingMonth (newest first) with S3 download URLs
   *
   * @param distributor - Optional distributor filter
   * @returns A list of imported report records with signed S3 URLs
   */
  @Get()
  async getImportedReports(
    @Query('distributor') distributor?: Distributor,
  ): Promise<ImportedReportDto[]> {
    return this.importedReportsService.getAllImportedReports(distributor);
  }
}
