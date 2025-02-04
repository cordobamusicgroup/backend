import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { Currency, TransactionType } from '@prisma/client';

export class ModifyBalanceDto {
  @IsNumber()
  clientId: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsNumber()
  amount: number;

  @IsString()
  description: string;
}
