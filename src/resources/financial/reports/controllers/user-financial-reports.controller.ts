import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserFinancialReportsService } from '../services/user/user-financial-reports.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Distributor } from 'generated/client';

@Controller('user-reports')
export class UserFinancialReportsController {
  constructor(
    private readonly userFinancialReports: UserFinancialReportsService,
  ) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserReports(
    @Request() req,
    @Query('distributor') distributor: Distributor,
  ) {
    if (!distributor) {
      throw new HttpException(
        'Distributor name is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.userFinancialReports.getCurrentUserReports(
      req.user,
      distributor,
    );
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
