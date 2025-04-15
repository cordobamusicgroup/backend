import { DebitState } from 'src/generated/client';
import { Expose } from 'class-transformer';

export class AdminFinancialReportDto {
  @Expose()
  id: number;

  @Expose()
  clientId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  currency: string; // New field

  @Expose()
  distributor: string; // New field

  @Expose()
  reportingMonth: string; // New field

  @Expose()
  totalRoyalties: number; // New field

  @Expose()
  debitState: DebitState;

  @Expose()
  paidOn: Date;
}
