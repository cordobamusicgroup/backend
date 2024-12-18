import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { UserFinancialReportsService } from '../services/user-financial-reports.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('user-reports')
export class UserFinancialReportsController {
  constructor(
    private readonly userFinancialReports: UserFinancialReportsService,
  ) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserReports(@Request() req) {
    return this.userFinancialReports.getCurrentUserReports(req.user);
  }

  @Get('download/:id')
  @UseGuards(JwtAuthGuard)
  async getUserReportFile(@Param('id') id: number, @Request() req) {
    const url = await this.userFinancialReports.getUserDownloadUrl(
      Number(id),
      req.user,
    );
    return { url }; // Return the URL in the response
  }
}
