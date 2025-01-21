import {
  Get,
  Post,
  Delete,
  Body,
  Param,
  Controller,
  Query,
} from '@nestjs/common';
import { AdminBaseReportService } from '../../services/admin/admin-base-report.service';
import { AdminReportsHelperService } from '../../services/admin/admin-reports-helper.service';
import { DistributorReportDto } from '../../dto/distributor-reportMonth.dto';
import { UserFinancialReportsService } from '../../services/user/user-financial-reports.service';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseReportDto } from '../../dto/admin-base-reports.dto';

@Controller('admin/base-reports')
@Roles(Role.ADMIN)
export class AdminBaseReportsController {
  constructor(
    private readonly baseReportService: AdminBaseReportService,
    private readonly reportsService: AdminReportsHelperService,
    private readonly userReports: UserFinancialReportsService,
  ) {}

  @Get()
  async getAllBaseReports(): Promise<BaseReportDto[]> {
    return this.baseReportService.getAllBaseReports();
  }

  @Post('create')
  async createBaseReport(@Body() createBaseReportDto: DistributorReportDto) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.createBaseReport(distributor, reportingMonth);
  }

  @Delete('delete')
  async deleteBaseReport(@Body() createBaseReportDto: DistributorReportDto) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.deleteBaseReport(distributor, reportingMonth);
  }

  @Post('generate-payments')
  async generatePayments(
    @Body() createBaseReportDto: DistributorReportDto,
    @Query('manual') manual: boolean,
    @Query('paidOn') paidOn?: string,
  ) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.generatePayments(
      distributor,
      reportingMonth,
      manual,
      paidOn,
    );
  }

  @Delete('delete-payments')
  async deletePayments(
    @Body() createBaseReportDto: DistributorReportDto,
    @Query('manual') manual: boolean,
  ) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.deletePayments(
      distributor,
      reportingMonth,
      manual,
    );
  }

  @Post('recalculate-totals')
  async recalculateTotals(@Body() createBaseReportDto: DistributorReportDto) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.recalculateTotals(
      distributor,
      reportingMonth,
    );
  }

  @Post('generate-csv')
  async generateBaseReportCsv(
    @Body() createBaseReportDto: DistributorReportDto,
  ) {
    const { distributor, reportingMonth } = createBaseReportDto;
    return this.baseReportService.generateBaseReportCsv(
      distributor,
      reportingMonth,
    );
  }

  @Get(':id')
  async getBaseReportWithSignedUrl(
    @Param('id') id: number,
  ): Promise<BaseReportDto> {
    return this.baseReportService.getBaseReportWithSignedUrl(Number(id));
  }
}
