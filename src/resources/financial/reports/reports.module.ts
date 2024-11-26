import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProcessReportsService } from './services/process-reports.service';
import { LinkUnlinkedProcessor } from './processors/link-unlinked-reports.processor';
import { ReportsAdminController } from './controllers/reports-admin.controller';
import { BaseReportService } from './services/base-report.service';
import { UserReportsService } from './services/user-reports.service';
import { ProgressService } from 'src/common/services/progress.service';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { S3UploadService } from 'src/common/services/s3-upload.service';
import { BaseReportsController } from './controllers/base-reports.controller';
import { ImportReportsController } from './controllers/import-reports.controller';
import { UnlinkedReportService } from './services/unlinked-report.service';
import { ImportReportsProcessor } from './processors/import-reports.processor';
import { UserReportsProcessor } from './processors/user-reports.processor';
import { EmailService } from 'src/resources/email/email.service';
import { AuthModule } from 'src/resources/auth/auth.module'; // Import AuthModule
import { UserReportsController } from './controllers/user-reports.controller';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      {
        name: 'link-unlinked-reports',
        defaultJobOptions: {
          attempts: 3,
          backoff: 5000,
        },
      },
      {
        name: 'user-reports',
        defaultJobOptions: {
          attempts: 1,
          backoff: 5000,
        },
      },
      {
        name: 'import-reports',
      },
    ),
    AuthModule,
  ],
  providers: [
    ProcessReportsService,

    ImportReportsProcessor,
    LinkUnlinkedProcessor,
    UserReportsProcessor,

    BaseReportService,
    UserReportsService,
    UnlinkedReportService,

    ProgressService,
    EmailService,
    LoggerTxtService,
    S3UploadService,
  ],
  controllers: [
    ReportsAdminController,
    BaseReportsController,
    ImportReportsController,
    UserReportsController,
  ],
  exports: [ProcessReportsService],
})
export class ReportsModule {}
