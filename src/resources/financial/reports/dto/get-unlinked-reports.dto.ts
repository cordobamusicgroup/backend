import { Expose } from 'class-transformer';

export class GetUnlinkedReportsDto {
  @Expose()
  unlinkedReportId: number;
}
