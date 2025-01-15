import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { UsersService } from 'src/resources/users/users.service';
import { S3Service } from 'src/common/services/s3.service';
import { AdminFinancialReportDto } from '../../dto/admin-financial-report.dto';
import { plainToInstance } from 'class-transformer';
import { DistributorReportDto } from '../../dto/distributor-reportMonth.dto';

@Injectable()
export class AdminUserReportsService {
  private readonly logger = new Logger(AdminUserReportsService.name);

  constructor(
    private usersService: UsersService,
    private readonly prisma: PrismaService,
    @InjectQueue('user-reports') private userReportsQueue: Queue,
    private readonly s3Service: S3Service,
  ) {}

  async createUserReportsJob(
    distributorReportDto: DistributorReportDto,
    action: 'generate' | 'delete' | 'export',
    user: JwtPayloadDto,
  ) {
    const { email } = await this.usersService.findByUsername(user.username);
    const { distributor, reportingMonth } = distributorReportDto;

    try {
      let result;
      if (action === 'generate') {
        await this.userReportsQueue.add('generate', {
          distributor,
          reportingMonth,
          email,
        });
        result = { message: 'User royalty reports queued for generation.' };
      } else if (action === 'delete') {
        await this.userReportsQueue.add('delete', {
          distributor,
          reportingMonth,
          email,
        });
        result = { message: 'User royalty reports queued for deletion.' };
      } else if (action === 'export') {
        await this.userReportsQueue.add('export', {
          distributor,
          reportingMonth,
          email,
        });
        result = { message: 'User royalty reports queued for export.' };
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to queue user report job: ${error.message}`);
      throw new Error(`Failed to queue user report job: ${error.message}`);
    }
  }

  async getAllUserReports(): Promise<AdminFinancialReportDto[]> {
    try {
      const reports = await this.prisma.userRoyaltyReport.findMany();
      const reportsWithUrls = await Promise.all(
        reports.map(async (report) => {
          try {
            const s3File = await this.s3Service.getFile({
              id: report.s3FileId,
            });
            return { ...report, s3Url: s3File.url };
          } catch (error) {
            return { ...report, s3Url: 'Pending' };
          }
        }),
      );
      return plainToInstance(AdminFinancialReportDto, reportsWithUrls, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(`Failed to get user reports: ${error.message}`);
      throw new HttpException(
        `Failed to get user reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteExportedFilesFromS3(
    distributorReportDto: DistributorReportDto,
  ): Promise<{ message: string }> {
    const { distributor, reportingMonth } = distributorReportDto;
    try {
      const reports = await this.prisma.userRoyaltyReport.findMany({
        where: { distributor, reportingMonth },
      });

      for (const report of reports) {
        if (report.s3FileId) {
          await this.s3Service.deleteFile({ id: report.s3FileId });
          await this.prisma.userRoyaltyReport.update({
            where: { id: report.id },
            data: { s3FileId: null },
          });
        }
      }

      return { message: 'Exported files deleted successfully from S3.' };
    } catch (error) {
      this.logger.error(
        `Failed to delete exported files from S3: ${error.message}`,
      );
      throw new HttpException(
        `Failed to delete exported files from S3: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUserRoyaltyReports(distributorReportDto: DistributorReportDto) {
    const { distributor, reportingMonth } = distributorReportDto;
    try {
      this.logger.log(
        `Starting deletion of user royalty reports for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );
      await this.deleteExportedFilesFromS3(distributorReportDto);

      await this.prisma.userRoyaltyReport.deleteMany({
        where: { distributor, reportingMonth },
      });

      this.logger.log(
        `User royalty reports deleted successfully for distributor: ${distributor}, reportingMonth: ${reportingMonth}`,
      );

      return {
        message: 'User royalty reports deleted successfully.',
      };
    } catch (error) {
      this.logger.error(
        `Error deleting user royalty reports: ${error.message}`,
      );
      throw new HttpException(
        `Error deleting user royalty reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
