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
    action:
      | 'GenerateUserReports'
      | 'DeleteUserReports'
      | 'ExportUserReports'
      | 'DeleteExportedUserReports',
    user: JwtPayloadDto,
  ) {
    const findUser = await this.usersService.findByUsername(user.username);
    const { distributor, reportingMonth } = distributorReportDto;

    try {
      let result;
      if (action === 'GenerateUserReports') {
        await this.userReportsQueue.add('GenerateUserReports', {
          distributor,
          reportingMonth,
          findUser,
        });
        result = {
          message:
            'User royalty reports queued for generation and automatic export.',
        };
      } else if (action === 'DeleteUserReports') {
        await this.userReportsQueue.add('DeleteUserReports', {
          distributor,
          reportingMonth,
          findUser,
        });
        result = {
          message: 'User royalty reports and CSV files queued for deletion.',
        };
      } else if (action === 'ExportUserReports') {
        await this.userReportsQueue.add('ExportUserReports', {
          distributor,
          reportingMonth,
          findUser,
        });
        result = {
          message: 'User royalty reports queued for export only.',
        };
      } else if (action === 'DeleteExportedUserReports') {
        await this.userReportsQueue.add('DeleteExportedUserReports', {
          distributor,
          reportingMonth,
          findUser,
        });
        result = {
          message: 'Exported CSV files queued for deletion.',
        };
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

  // Delete via queue - both reports and exports
  async deleteUserRoyaltyReports(
    distributorReportDto: DistributorReportDto,
    user: JwtPayloadDto,
  ) {
    return this.createUserReportsJob(
      distributorReportDto,
      'DeleteUserReports',
      user,
    );
  }

  // Delete only the exports via queue
  async deleteExportedFilesFromS3(
    distributorReportDto: DistributorReportDto,
    user: JwtPayloadDto,
  ) {
    return this.createUserReportsJob(
      distributorReportDto,
      'DeleteExportedUserReports',
      user,
    );
  }
}
