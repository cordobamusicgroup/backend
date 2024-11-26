import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BaseReportService } from '../services/base-report.service';
import { ProcessReportsService } from '../services/process-reports.service';
import { CreateBaseReportDto } from '../dto/create-base-report.dto';
import { UserReportsService } from '../services/user-reports.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('admin/base-reports')
export class BaseReportsController {
  constructor(
    private readonly baseReportService: BaseReportService,
    private readonly reportsService: ProcessReportsService,
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

  @Delete('delete/:baseReportId')
  async deleteBaseReport(@Param('baseReportId') baseReportId: number) {
    return this.baseReportService.deleteBaseReport(Number(baseReportId));
  }

  @Post('GenerateUserReports/:baseReportId')
  @UseGuards(JwtAuthGuard)
  async generateUserRoyaltyReports(
    @Param('baseReportId') baseReportId: number,
    @Request() req,
  ) {
    return this.userReports.createUserReportsJob(
      Number(baseReportId),
      'generate',
      req.user,
    );
  }

  @Delete('DeleteUserReports/:baseReportId')
  @UseGuards(JwtAuthGuard)
  async deleteUserRoyaltyReports(
    @Param('baseReportId') baseReportId: number,
    @Request() req,
  ) {
    return this.userReports.createUserReportsJob(
      Number(baseReportId),
      'delete',
      req.user,
    );
  }
}
