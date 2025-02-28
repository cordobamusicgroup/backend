import { Distributor } from '@prisma/client';

/**
 * Data transfer object for linking unlinked reports to a specific label.
 * This DTO is used as input for the queue job that processes unlinked reports.
 */
export interface LinkUnlinkedReportJobDto {
  /**
   * The database identifier of the unlinked report to process
   */
  unlinkedReportId: number;

  /**
   * The database identifier of the label to associate with the unlinked report
   */
  labelId: number;

  /**
   * The reporting month in YYYY-MM format that this report belongs to
   */
  reportingMonth: string;

  /**
   * The distributor that provided the original report
   */
  distributor: Distributor;
}
