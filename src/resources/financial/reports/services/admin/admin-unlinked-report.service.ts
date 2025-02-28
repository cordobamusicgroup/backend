import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { LinkUnlinkedReportDto } from '../../dto/admin-link-unlinked-report.dto';
import { Distributor } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bull';

/**
 * Service for managing unlinked royalty reports
 *
 * This service handles operations related to reports that couldn't be automatically
 * linked to labels during the import process.
 */
@Injectable()
export class AdminUnlinkedReportService {
  private readonly logger = new Logger(AdminUnlinkedReportService.name);

  constructor(
    @InjectQueue('import-reports') private importReportsQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Queues an unlinked report for processing with a specified label
   *
   * @param linkUnlinkedReportDto - Data containing unlinked report ID and label to link with
   * @returns Object with confirmation message and IDs
   * @throws BadRequestException if the unlinked report is not found or already has a job in progress
   */
  async linkUnlinkedReport(linkUnlinkedReportDto: LinkUnlinkedReportDto) {
    const { unlinkedReportId, labelId } = linkUnlinkedReportDto;

    this.logger.log(
      `Starting linking process for UnlinkedReport ID: ${unlinkedReportId} to Label ID: ${labelId}`,
    );

    // Verify the unlinked report exists
    const unlinkedReport = await this.getUnlinkedRecords(unlinkedReportId);
    if (!unlinkedReport) {
      this.logger.error(`UnlinkedReport with ID ${unlinkedReportId} not found`);
      throw new BadRequestException(
        `UnlinkedReport with ID ${unlinkedReportId} not found`,
      );
    }

    // Check if there's already a job processing this unlinked report
    await this.validateNoJobInProgress(unlinkedReportId);

    const { distributor, reportingMonth } = unlinkedReport;
    this.logger.log(
      `Found unlinked report for ${distributor} (${reportingMonth}) with ${unlinkedReport.count} records`,
    );

    // Add the job to the queue for processing
    await this.importReportsQueue.add('LinkUnlinkedReport', {
      unlinkedReportId,
      labelId,
      reportingMonth,
      distributor,
    });

    this.logger.log(
      `Successfully queued unlinked report ${unlinkedReportId} for linking to label ${labelId}`,
    );

    return {
      message: 'Unlinked report queued for linking.',
      unlinkedReportId,
      labelId,
    };
  }

  /**
   * Validates that there isn't already a job in progress for the unlinked report
   *
   * @param unlinkedReportId The unlinked report ID to validate
   * @throws BadRequestException if a job is already in progress for this unlinked report
   */
  async validateNoJobInProgress(unlinkedReportId: number) {
    const existingJobs = await this.importReportsQueue.getJobs([
      'waiting',
      'active',
    ]);

    const isJobInProgress = existingJobs.some(
      (job) =>
        job.name === 'LinkUnlinkedReport' &&
        job.data.unlinkedReportId === unlinkedReportId,
    );

    if (isJobInProgress) {
      this.logger.warn(
        `There is already a job in progress for unlinked report ID: ${unlinkedReportId}`,
      );
      throw new BadRequestException(
        'There is already a job in progress for this unlinked report.',
      );
    }
  }

  /**
   * Gets all unlinked reports
   *
   * @returns Array of all unlinked reports
   */
  async getAllUnlinkedReports() {
    return this.prisma.unlinkedReport.findMany({});
  }

  /**
   * Gets unlinked report details by ID
   *
   * @param unlinkedReportId The ID of the unlinked report
   * @returns Unlinked report with its details
   */
  async getUnlinkedRecords(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.findUnique({
      where: { id: unlinkedReportId },
      include: { UnlinkedReportDetail: true },
    });
  }

  /**
   * Deletes an unlinked report by ID
   *
   * @param unlinkedReportId The ID of the unlinked report to delete
   * @returns The deletion result
   */
  async deleteUnlinkedReport(unlinkedReportId: number) {
    return this.prisma.unlinkedReport.delete({
      where: { id: unlinkedReportId },
    });
  }

  /**
   * Deletes all unlinked reports for a specific distributor and reporting month
   *
   * @param distributor The distributor of the reports to delete
   * @param reportingMonth The reporting month of the reports to delete
   * @returns The deletion result with count of deleted records
   */
  async deleteManyUnlinkedReports(
    distributor: Distributor,
    reportingMonth: string,
  ) {
    return this.prisma.unlinkedReport.deleteMany({
      where: {
        distributor,
        reportingMonth,
      },
    });
  }
}
