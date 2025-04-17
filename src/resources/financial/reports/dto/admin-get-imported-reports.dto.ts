import { Distributor } from 'generated/client';

export class ImportedReportDto {
  id: number;
  reportingMonth: string;
  distributor: Distributor;
  url?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
