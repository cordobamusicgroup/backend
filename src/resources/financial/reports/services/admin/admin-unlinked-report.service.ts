import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AdminReportProcessCSVService } from './admin-report-process-csv.service';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { LinkUnlinkedReportDto } from '../../dto/admin-link-unlinked-report.dto';
import { ProcessingType } from '../../enums/processing-type.enum';

@Injectable()
export class AdminUnlinkedReportService {
  private readonly logger = new Logger(AdminUnlinkedReportService.name);

  constructor(
    //@Inject(forwardRef(() => AdminReportsHelperService))
    // TODO; Fix circular dependency
    private readonly processReportsService: AdminReportProcessCSVService,
    private readonly prisma: PrismaService,
  ) {}

  async linkUnlinkedReport(linkUnlinkedReportDto: LinkUnlinkedReportDto) {
    const { unlinkedReportId, labelId } = linkUnlinkedReportDto;

    this.logger.log(
      `Starting linking process for UnlinkedReport ID: ${unlinkedReportId}`,
    );

    const unlinkedReport = await this.getUnlinkedRecords(unlinkedReportId);
    if (!unlinkedReport) {
      this.logger.error(
        `UnlinkedReport with ID ${unlinkedReportId} not found.`,
      );
      throw new BadRequestException(
        `UnlinkedReport with ID ${unlinkedReportId} not found.`,
      );
    }

    const { distributor, reportingMonth, UnlinkedReportDetail } =
      unlinkedReport;
    for (
      let reportIndex = 0;
      reportIndex < UnlinkedReportDetail.length;
      reportIndex++
    ) {
      const record_detail = UnlinkedReportDetail[reportIndex];
      const records_detailData = record_detail.data as Record<string, any>;

      try {
        // Process the record with the provided labelId
        await this.processReportsService.processCSVRecord(
          records_detailData as RoyaltyReportRecordType,
          distributor,
          reportingMonth,
          ProcessingType.UNLINKED,
          reportIndex,
          labelId,
        );
      } catch (error) {
        this.logger.error(
          `Error processing row ${reportIndex}: ${error.message}`,
        );
        await this.processReportsService.saveFailedRecord(
          records_detailData as RoyaltyReportRecordType,
          distributor,
          reportingMonth,
          error.message,
        );
      }
    }

    this.logger.log(`Linking complete`);
    await this.deleteUnlinkedReport(unlinkedReportId);
  }

  async getAllUnlinkedReports() {
    return this.prisma.unlinkedReport.findMany({});
  }

  async getUnlinkedRecords(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.findUnique({
      where: { id: unlinkedReportId },
      include: { UnlinkedReportDetail: true },
    });
  }

  async deleteUnlinkedReport(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.delete({
      where: { id: unlinkedReportId },
    });
  }
}
