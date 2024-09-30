import { Currency } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';

export class ModifyBalanceDto {
  @IsNotEmpty()
  @IsNumber()
  clientId: number;

  @IsNotEmpty()
  @IsString()
  currency: Currency;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(['CREDIT', 'DEBIT'])
  operationType: 'CREDIT' | 'DEBIT';
}
