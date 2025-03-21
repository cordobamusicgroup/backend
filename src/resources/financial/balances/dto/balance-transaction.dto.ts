import { Expose } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class BalanceTransactionDto {
  @Expose()
  id: number;

  @Expose()
  type: TransactionType;

  @Expose()
  description: string;

  @Expose()
  amount: number;

  @Expose()
  balanceAmount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
