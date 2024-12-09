import {
  Controller,
  Post,
  Param,
  Delete,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { UserReportsService } from '../../services/user-reports.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('admin/user-reports')
@Roles(Role.ADMIN)
export class UserReportsAdminController {
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

  @Post('export/:baseReportId')
  @UseGuards(JwtAuthGuard)
  async exportUserRoyaltyReports(
    @Param('baseReportId') baseReportId: number,
    @Request() req,
  ) {
    return this.userReports.createUserReportsJob(
      Number(baseReportId),
      'export',
      req.user,
    );
  }

  @Delete('delete-export/:baseReportId')
  @UseGuards(JwtAuthGuard)
  async deleteExportedFilesFromS3(@Param('baseReportId') baseReportId: number) {
    return this.userReports.deleteExportedFilesFromS3(Number(baseReportId));
  }
}
