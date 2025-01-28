import { Currency, Transaction } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsArray } from 'class-validator';

export class BalanceDto {
  @Expose()
  @IsNotEmpty()
  id: number;

  @Expose()
  @IsNotEmpty()
  currency: Currency;

  @Expose()
  @IsNumber()
  amount: number;

  @Expose()
  @IsNumber()
  amountRetain: number;

  @Expose()
  @IsArray()
  transactions: Transaction[];
}
