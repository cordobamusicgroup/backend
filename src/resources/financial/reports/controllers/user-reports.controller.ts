import {
  Controller,
  Post,
  Param,
  Delete,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { UserReportsService } from '../services/user-reports.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('admin/user-reports')
export class UserReportsController {
  constructor(private readonly userReports: UserReportsService) {}

  @Post('generate/:baseReportId')
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

  @Delete('delete/:baseReportId')
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

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllUserReports() {
    return this.userReports.getAllUserReports();
  }
}
