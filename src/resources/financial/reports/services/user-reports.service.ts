import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuthService } from 'src/resources/auth/auth.service';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { PrismaService } from 'src/resources/prisma/prisma.service';

@Injectable()
export class UserReportsService {
  private readonly logger = new Logger(UserReportsService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    @InjectQueue('user-reports') private userReportsQueue: Queue,
  ) {}

  async createUserReportsJob(
    baseReportId: number,
    action: 'generate' | 'delete',
    user: JwtPayloadDto,
  ) {
    const { email } = await this.authService.getCurrentUserData(user);

    try {
      let result;
      if (action === 'generate') {
        await this.userReportsQueue.add('generate', {
          baseReportId,
          email,
        });
        result = { message: 'User royalty reports queued for generation.' };
      } else if (action === 'delete') {
        await this.userReportsQueue.add('delete', { baseReportId, email });
        result = { message: 'User royalty reports queued for deletion.' };
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to queue user report job: ${error.message}`);
      throw new Error(`Failed to queue user report job: ${error.message}`);
    }
  }

  async getAllUserReports() {
    try {
      const reports = await this.prisma.userRoyaltyReport.findMany();
      return reports;
    } catch (error) {
      this.logger.error(`Failed to get user reports: ${error.message}`);
      throw new HttpException(
        `Failed to get user reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
