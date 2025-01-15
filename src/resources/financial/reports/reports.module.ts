import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminReportsHelperService } from './services/admin/admin-reports-helper.service';
import { AdminUnlinkedReportsController } from './controllers/admin/admin-unlinked-reports.controller';
import { AdminBaseReportService } from './services/admin/admin-base-report.service';
import { UserFinancialReportsService } from './services/user/user-financial-reports.service';
import { ProgressService } from 'src/common/services/progress.service';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { S3Service } from 'src/common/services/s3.service';
import { AdminBaseReportsController } from './controllers/admin/admin-base-reports.controller';
import { AdminImportReportsController } from './controllers/admin/admin-import-reports.controller';
import { ImportReportsProcessor } from './processors/import-reports.processor';
import { UserReportsProcessor } from './processors/user-reports.processor';
import { EmailService } from 'src/resources/email/email.service';
import { AdminUserReportsController } from './controllers/admin/admin-user-reports.controller';
import { UsersModule } from 'src/resources/users/users.module';
import { UserFinancialReportsController } from './controllers/user-financial-reports.controller';
import { AdminImportedReportsService } from './services/admin/admin-imported-reports.service';
import { AdminUserReportsService } from './services/admin/admin-user-reports.service';
import { ReportsGateway } from './gateways/reports.gateway';
import { AdminUnlinkedReportService } from './services/admin/admin-unlinked-report.service';
@Module({
  imports: [
    PrismaModule,
    UsersModule,
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
  ],
  providers: [
    // Services from Module
    AdminBaseReportService,
    AdminImportedReportsService,
    AdminReportsHelperService,
    AdminUserReportsService,
    UserFinancialReportsService,
    AdminUnlinkedReportService,
    // Global Services
    LoggerTxtService,
    ProgressService,
    S3Service,
    EmailService,
    // Processors
    ImportReportsProcessor,
    UserReportsProcessor,
    ReportsGateway,
  ],
  controllers: [
    AdminBaseReportsController,
    AdminImportReportsController,
    AdminUnlinkedReportsController,
    AdminUserReportsController,
    UserFinancialReportsController,
  ],
  exports: [
    AdminReportsHelperService,
    AdminImportedReportsService,
    AdminUnlinkedReportService,
  ],
})
export class ReportsModule {}
