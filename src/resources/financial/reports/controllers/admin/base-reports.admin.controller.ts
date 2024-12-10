import { Controller, Post, Get, Delete, Body } from '@nestjs/common';
import { BaseReportService } from '../../services/base-report.service';
import { ReportsService } from '../../services/reports.service';
import { CreateBaseReportDto } from '../../dto/create-base-report.dto';
import { UserReportsService } from '../../services/user-reports.service';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('admin/base-reports')
@Roles(Role.ADMIN)
export class BaseReportsAdminController {
  constructor(
    private readonly baseReportService: BaseReportService,
    private readonly reportsService: ReportsService,
    private readonly userReports: UserReportsService,
  ) {}

  @Get()
  async getAllBaseReports() {
    return this.baseReportService.getAllBaseReports();
  }

  @Post('create')
  async createBaseReport(@Body() createBaseReportDto: CreateBaseReportDto) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.createBaseReport(distributor, reportingMonth);
  }

  @Delete('delete')
  async deleteBaseReport(@Body() createBaseReportDto: CreateBaseReportDto) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.deleteBaseReport(distributor, reportingMonth);
  }

  @Post('generate-payments')
  async generatePayments(@Body() createBaseReportDto: CreateBaseReportDto) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.generatePayments(distributor, reportingMonth);
  }

  @Delete('delete-payments')
  async deletePayments(@Body() createBaseReportDto: CreateBaseReportDto) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.deletePayments(distributor, reportingMonth);
  }

  @Post('recalculate-totals')
  async recalculateTotals(@Body() createBaseReportDto: CreateBaseReportDto) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.recalculateTotals(
      distributor,
      reportingMonth,
    );
  }
}
