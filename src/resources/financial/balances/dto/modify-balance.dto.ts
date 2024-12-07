import { IsNumber, IsString, IsEnum } from 'class-validator';
import { Currency } from '@prisma/client';

export class ModifyBalanceDto {
  @IsNumber()
  clientId: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  amount: number;

  @IsString()
  description: string;
}
