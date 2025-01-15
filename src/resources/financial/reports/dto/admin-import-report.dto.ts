import { Distributor } from '@prisma/client';

export class ImportReportDto {
  filePath: string;
  reportingMonth: string;
  distributor: Distributor;
  importReportId: number;
}
