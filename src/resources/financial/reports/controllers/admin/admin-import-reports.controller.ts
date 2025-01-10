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
import { Distributor, Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminReportsHelperService } from '../../services/admin-reports-helper.service';
import { UploadCsvDto } from '../../dto/admin-upload-csv.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AdminImportedReportsService } from '../../services/admin-imported-reports.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('admin/import')
@Roles(Role.ADMIN)
export class AdminImportReportsController {
  constructor(
    private readonly reportsService: AdminReportsHelperService,
    private readonly importedReportsService: AdminImportedReportsService,
    @InjectQueue('import-reports') private readonly importReportsQueue: Queue,
  ) {}

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
    return this.reportsService.uploadCsvToQueue(uploadCsvDto);
  }

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
    return this.reportsService.uploadCsvToQueue(uploadCsvDto);
  }

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

  @Post('reprocess')
  async reprocessFile(
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

    return this.importedReportsService.reprocessFile(
      reportingMonth,
      distributor,
    );
  }

  @Post('convert-link-old-reports')
  async convertAndLinkOldReports(
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

    return this.importedReportsService.convertAndLinkOldReports(
      reportingMonth,
      distributor,
    );
  }

  @Get('imported-reports')
  async getImportedReports() {
    return this.importedReportsService.getAllImportedReports();
  }
}
