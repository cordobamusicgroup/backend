import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { UserReportsService } from '../services/user-reports.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('user-reports')
export class UserReportsUserController {
  constructor(private readonly userReports: UserReportsService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserReports(@Request() req) {
    return this.userReports.getCurrentUserReports(req.user);
  }

  @Get('download/:id')
  @UseGuards(JwtAuthGuard)
  async getUserReportFile(@Param('id') id: number, @Request() req) {
    const url = await this.userReports.getUserDownloadUrl(Number(id), req.user);
    return { url }; // Return the URL in the response
  }
}
