// src/resources/reports/reports.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';
import { Distributor } from '../../common/enums/distributor.enum';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('distributor') distributor: Distributor,
  ) {
    await this.reportsService.processCsv(file.path, distributor);
    return { message: 'File uploaded and processing started' };
  }

  @Get('unlinked')
  async getUnlinkedReports() {
    return this.reportsService.getUnlinkedReports();
  }

  @Post('assign-label')
  async assignLabelToUnlinkedReports(
    @Body('labelId') labelId: number,
    @Body('unlinkedReportId') unlinkedReportId: number,
    @Body('distributor') distributor: Distributor,
  ) {
    await this.reportsService.assignLabelToUnlinkedReports(
      labelId,
      unlinkedReportId,
      distributor,
    );
    return { message: 'Unlinked reports assigned successfully' };
  }
}
