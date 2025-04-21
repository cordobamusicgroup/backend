// src/resources/financial/reports/reports.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UsePipes,
  ValidationPipe,
  Param,
} from '@nestjs/common';

import { Role } from 'generated/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AdminUnlinkedReportService } from '../../services/admin/admin-unlinked-report.service';
import { LinkUnlinkedReportDto } from '../../dto/admin-link-unlinked-report.dto';

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminUnlinkedReportsController {
  constructor(private readonly reportsService: AdminUnlinkedReportService) {}

  // Unlinked Reports Endpoints

  /**
   * Retrieves all unlinked reports that do NOT have a job in progress.
   */
  @Get('unlinked')
  async getAllUnlinkedReports() {
    return this.reportsService.getAllUnlinkedReports();
  }

  /**
   * Retrieves individual unlinked report info by ID.
   */
  @Get('unlinked/:id')
  async getUnlinkedReportById(@Param('id') id: string) {
    return this.reportsService.getUnlinkedReportInfo(Number(id));
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
    return this.reportsService.linkUnlinkedReport(linkUnlinkedReportDto);
  }
}
