import { Expose } from 'class-transformer';
import { Currency, Transaction } from '@prisma/client';

export class BalanceDto {
  @Expose()
  id: number;

  @Expose()
  currency: Currency;

  @Expose()
  amount: number;

  @Expose()
  transactions: Transaction[];
}
