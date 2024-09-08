import { ContractStatus, ContractType } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns/format';

export class ContractDto {
  @Expose()
  contractId: string;

  @Expose()
  contractType: ContractType;

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
