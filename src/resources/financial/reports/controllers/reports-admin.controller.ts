// src/resources/financial/reports/reports.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ProcessReportsService } from '../services/process-reports.service';
import { LinkUnlinkedReportDto } from '../dto/link-unlinked-report.dto';
import { UnlinkedReportService } from '../services/unlinked-report.service';

@Controller('admin')
@Roles(Role.ADMIN)
export class ReportsAdminController {
  constructor(
    private readonly reportsService: ProcessReportsService,
    private readonly unlinkedReportService: UnlinkedReportService,
  ) {}

  // Unlinked Reports Endpoints

  /**
   * Retrieves all unlinked reports.
   * @returns An array of all unlinked reports.
   */
  @Get('unlinked')
  async getAllUnlinkedReports() {
    return this.unlinkedReportService.getAllUnlinkedReports();
  }

  /**
   * Links unlinked reports.
   * @param linkUnlinkedReportDto The DTO containing the unlinked report ID and label ID.
   * @returns A message indicating the unlinked report has been queued for processing.
   */
  @Post('link-missing')
  @UsePipes(new ValidationPipe({ transform: true }))
  async LinkUnlinkedReports(
    @Body() linkUnlinkedReportDto: LinkUnlinkedReportDto,
  ) {
    return this.unlinkedReportService.linkUnlinkedReport(linkUnlinkedReportDto);
  }
}
