import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsService } from './services/reports.service';
import { UnlinkedReportsAdminController } from './controllers/admin/unlinked-reports.admin.controller';
import { BaseReportService } from './services/base-report.service';
import { UserReportsService } from './services/user-reports.service';
import { ProgressService } from 'src/common/services/progress.service';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { S3Service } from 'src/common/services/s3.service';
import { BaseReportsAdminController } from './controllers/admin/base-reports.admin.controller';
import { ImportReportsAdminController } from './controllers/admin/import-reports.admin.controller';
import { ImportReportsProcessor } from './processors/import-reports.processor';
import { UserReportsProcessor } from './processors/user-reports.processor';
import { EmailService } from 'src/resources/email/email.service';
import { UserReportsAdminController } from './controllers/admin/user-reports.admin.controller';
import { UsersModule } from 'src/resources/users/users.module';
import { UserReportsUserController } from './controllers/user-reports.user.controller';
import { ImportedReportsService } from './services/imported-reports.service';
import { PrismaService } from 'src/resources/prisma/prisma.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
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
    UsersModule,
  ],
  providers: [
    ReportsService,
    ImportedReportsService,
    ImportReportsProcessor,
    UserReportsProcessor,
    BaseReportService,
    UserReportsService,
    PrismaService,
    ProgressService,
    EmailService,
    LoggerTxtService,
    S3Service,
  ],
  controllers: [
    UnlinkedReportsAdminController,
    BaseReportsAdminController,
    ImportReportsAdminController,
    UserReportsAdminController,
    UserReportsUserController,
  ],
  exports: [ReportsService, ImportedReportsService],
})
export class ReportsModule {}
