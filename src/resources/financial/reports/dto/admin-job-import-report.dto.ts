import { Distributor } from '@prisma/client';

export class JobImportReportDto {
  filePath: string;
  reportingMonth: string;
  distributor: Distributor;
  importReportId: number;
}
