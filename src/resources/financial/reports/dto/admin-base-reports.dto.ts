import { Expose } from 'class-transformer';

export class BaseReportDto {
  @Expose()
  id: number;

  @Expose()
  distributor: string;

  @Expose()
  reportingMonth: string;

  @Expose()
  currency: string;

  @Expose()
  totalRoyalties: number;

  @Expose()
  totalEarnings: number;

  @Expose()
  url?: string;
}
