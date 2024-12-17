import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminReportsHelperService } from './services/admin-reports-helper.service';
import { AdminUnlinkedReportsController } from './controllers/admin/admin-unlinked-reports.controller';
import { AdminBaseReportService } from './services/admin-base-report.service';
import { UserFinancialReportsService } from './services/user-financial-reports.service';
import { ProgressService } from 'src/common/services/progress.service';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';
import { S3Service } from 'src/common/services/s3.service';
import { AdminBaseReportsController } from './controllers/admin/admin-base-reports.controller';
import { AdminImportReportsController } from './controllers/admin/admin-import-reports.controller';
import { ImportReportsProcessor } from './processors/import-reports.processor';
import { UserReportsProcessor } from './processors/user-reports.processor';
import { EmailService } from 'src/resources/email/email.service';
import { AdminFinancialReportsController } from './controllers/admin/admin-financial-reports.controller';
import { UsersModule } from 'src/resources/users/users.module';
import { UserFinancialReportsController } from './controllers/user-financial-reports.controller';
import { AdminImportedReportsService } from './services/admin-imported-reports.service';
import { AdminFinancialReportsService } from './services/admin-financial-reports.service';
import { ReportsGateway } from './gateways/reports.gateway';

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
    AdminFinancialReportsService,
    UserFinancialReportsService,
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
    AdminFinancialReportsController,
    UserFinancialReportsController,
  ],
  exports: [AdminReportsHelperService, AdminImportedReportsService],
})
export class ReportsModule {}
