import { IsNumber } from 'class-validator';

export class GetUnlinkedReportsDto {
  @IsNumber()
  unlinkedReportId: number;
}
