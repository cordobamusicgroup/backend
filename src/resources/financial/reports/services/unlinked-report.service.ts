import {
  BadRequestException,
  Injectable,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { LinkUnlinkedReportDto } from '../dto/link-unlinked-report.dto';

@Injectable()
export class UnlinkedReportService {
  private readonly logger = new Logger(UnlinkedReportService.name);

  constructor(
    @Inject(forwardRef(() => ReportsService))
    private readonly processReportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  async linkUnlinkedReport(linkUnlinkedReportDto: LinkUnlinkedReportDto) {
    return this.processReportsService.linkUnlinkedReport(linkUnlinkedReportDto);
  }

  async getAllUnlinkedReports() {
    return this.processReportsService.getAllUnlinkedReports();
  }
}
