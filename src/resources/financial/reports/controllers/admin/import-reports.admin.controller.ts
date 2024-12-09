import {
  Controller,
  Post,
  UploadedFile,
  Body,
  BadRequestException,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { Distributor, Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from '../../services/reports.service';
import { UploadCsvDto } from '../../dto/upload-csv.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ImportedReportsService } from '../../services/imported-reports.service';

@Controller('admin/import')
@Roles(Role.ADMIN)
export class ImportReportsAdminController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly importedReportsService: ImportedReportsService,
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
    );
  }
}
