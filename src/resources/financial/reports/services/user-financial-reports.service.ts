import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { UsersService } from 'src/resources/users/users.service';
import { S3Service } from 'src/common/services/s3.service';
import { AdminFinancialReportDto } from '../dto/admin-financial-report.dto';
import { plainToInstance } from 'class-transformer';
import { UserFinancialReportDto } from '../dto/user-financial-report.dto';

@Injectable()
export class UserFinancialReportsService {
  private readonly logger = new Logger(UserFinancialReportsService.name);

  constructor(
    private usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}
  async getCurrentUserReports(
    user: JwtPayloadDto,
  ): Promise<UserFinancialReportDto[]> {
    try {
      const userData = await this.usersService.findByUsername(user.username);

      const reports = await this.prisma.userRoyaltyReport.findMany({
        where: { clientId: userData.clientId },
      });

      return plainToInstance(AdminFinancialReportDto, reports, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(`Failed to get current user reports: ${error.message}`);
      throw new HttpException(
        `Failed to get current user reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserDownloadUrl(
    reportId: number,
    user: JwtPayloadDto,
  ): Promise<string> {
    try {
      const report = await this.prisma.userRoyaltyReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
      }

      const userData = await this.usersService.findByUsername(user.username);

      if (report.clientId !== userData.clientId) {
        throw new NotFoundException();
      }

      if (!report.s3FileId) {
        throw new HttpException(
          'File not generated yet, please try again later',
          HttpStatus.NOT_FOUND,
        );
      }

      const s3File = await this.s3Service.getFile({ id: report.s3FileId });
      if (!s3File.url) {
        throw new HttpException(
          'File not generated yet, please try again later',
          HttpStatus.NOT_FOUND,
        );
      }
      return s3File.url; // Return the URL as a string
    } catch (error) {
      this.logger.error(`Failed to get download URL: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get download URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
