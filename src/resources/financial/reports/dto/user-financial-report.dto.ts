import { DebitState } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserFinancialReportDto {
  @Expose()
  id: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  currency: string;

  @Expose()
  distributor: string;

  @Expose()
  reportingMonth: string;

  @Expose()
  totalRoyalties: number;

  @Expose()
  debitState: DebitState;

  @Expose()
  paidOn: Date;
}
