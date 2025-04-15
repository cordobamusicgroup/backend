import { ContractStatus, ContractType } from 'src/generated/client';
import { Expose } from 'class-transformer';

export class ContractDto {
  @Expose()
  id: number;

  @Expose()
  uuid: string;

  @Expose()
  type: ContractType;

  @Expose()
  ppd?: number;

  @Expose()
  status: ContractStatus;

  @Expose()
  docUrl?: string;

  @Expose()
  startDate: string;

  @Expose()
  endDate?: string;

  @Expose()
  signed: boolean;

  @Expose()
  signedAt?: string;

  @Expose()
  signedBy?: string;
}
