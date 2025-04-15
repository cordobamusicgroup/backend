import { Distributor } from 'src/generated/client';

export class JobImportReportDto {
  filePath: string;
  reportingMonth: string;
  distributor: Distributor;
  importReportId: number;
}
