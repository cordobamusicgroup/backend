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
import { AdminReportsHelperService } from '../../services/admin-reports-helper.service';
import { LinkUnlinkedReportDto } from '../../dto/admin-link-unlinked-report.dto';

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminUnlinkedReportsController {
  constructor(private readonly reportsService: AdminReportsHelperService) {}

  // Unlinked Reports Endpoints

  /**
   * Retrieves all unlinked reports.
   * @returns An array of all unlinked reports.
   */
  @Get('unlinked')
  async getAllUnlinkedReports() {
    return this.reportsService.getAllUnlinkedReports();
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
