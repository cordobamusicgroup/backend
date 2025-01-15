import {
  Controller,
  Post,
  Body,
  Delete,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AdminUserReportsService } from '../../services/admin/admin-user-reports.service';
import { DistributorReportDto } from '../../dto/distributor-reportMonth.dto';

@Controller('admin/user-reports')
@Roles(Role.ADMIN)
export class AdminUserReportsController {
  constructor(
    private readonly adminFinancialReports: AdminUserReportsService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generateUserRoyaltyReports(
    @Body() distributorReportDto: DistributorReportDto,
    @Request() req,
  ) {
    return this.adminFinancialReports.createUserReportsJob(
      distributorReportDto,
      'generate',
      req.user,
    );
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async deleteUserRoyaltyReports(
    @Body() distributorReportDto: DistributorReportDto,
  ) {
    return this.adminFinancialReports.deleteUserRoyaltyReports(
      distributorReportDto,
    );
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllUserReports() {
    return this.adminFinancialReports.getAllUserReports();
  }

  @Post('export')
  @UseGuards(JwtAuthGuard)
  async exportUserRoyaltyReports(
    @Body() distributorReportDto: DistributorReportDto,
    @Request() req,
  ) {
    return this.adminFinancialReports.createUserReportsJob(
      distributorReportDto,
      'export',
      req.user,
    );
  }

  @Delete('delete-export')
  @UseGuards(JwtAuthGuard)
  async deleteExportedFilesFromS3(
    @Body() distributorReportDto: DistributorReportDto,
  ) {
    return this.adminFinancialReports.deleteExportedFilesFromS3(
      distributorReportDto,
    );
  }
}
