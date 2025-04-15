import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { Currency, TransactionType } from 'src/generated/client';

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
