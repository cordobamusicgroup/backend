import {
  Controller,
  Post,
  Param,
  Delete,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AdminFinancialReportsService } from '../../services/admin-financial-reports.service';

@Controller('admin/user-reports')
@Roles(Role.ADMIN)
export class AdminUserReportsController {
  constructor(
    private readonly adminFinancialReports: AdminFinancialReportsService,
  ) {}

  @Post('generate/:baseReportId')
  @UseGuards(JwtAuthGuard)
  async generateUserRoyaltyReports(
    @Param('baseReportId') baseReportId: number,
    @Request() req,
  ) {
    return this.adminFinancialReports.createUserReportsJob(
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
    return this.adminFinancialReports.createUserReportsJob(
      Number(baseReportId),
      'delete',
      req.user,
    );
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllUserReports() {
    return this.adminFinancialReports.getAllUserReports();
  }

  @Post('export/:baseReportId')
  @UseGuards(JwtAuthGuard)
  async exportUserRoyaltyReports(
    @Param('baseReportId') baseReportId: number,
    @Request() req,
  ) {
    return this.adminFinancialReports.createUserReportsJob(
      Number(baseReportId),
      'export',
      req.user,
    );
  }

  @Delete('delete-export/:baseReportId')
  @UseGuards(JwtAuthGuard)
  async deleteExportedFilesFromS3(@Param('baseReportId') baseReportId: number) {
    return this.adminFinancialReports.deleteExportedFilesFromS3(
      Number(baseReportId),
    );
  }
}
