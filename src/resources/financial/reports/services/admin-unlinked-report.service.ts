import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { AdminReportsHelperService } from './admin-reports-helper.service';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { LinkUnlinkedReportDto } from '../dto/admin-link-unlinked-report.dto';

@Injectable()
export class AdminUnlinkedReportService {
  private readonly logger = new Logger(AdminUnlinkedReportService.name);

  constructor(
    @Inject(forwardRef(() => AdminReportsHelperService))
    private readonly processReportsService: AdminReportsHelperService,
    private readonly prisma: PrismaService,
  ) {}

  async linkUnlinkedReport(linkUnlinkedReportDto: LinkUnlinkedReportDto) {
    return this.processReportsService.linkUnlinkedReport(linkUnlinkedReportDto);
  }

  async getAllUnlinkedReports() {
    return this.processReportsService.getAllUnlinkedReports();
  }
}
