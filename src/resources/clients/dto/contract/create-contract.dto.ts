import { ContractStatus, ContractType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export class CreateContractDto {
  @IsEnum(ContractType)
  @IsNotEmpty()
  contractType: ContractType;

  @ValidateIf((o) => o.signed === true)
  @IsNotEmpty()
  @IsNumber()
  ppd?: number;

  @IsEnum(ContractStatus)
  @IsNotEmpty()
  status: ContractStatus;

  @IsOptional()
  @IsString()
  docUrl?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsBoolean()
  @IsNotEmpty()
  signed: boolean;

  @ValidateIf((o) => o.signed === true)
  @IsNotEmpty()
  @IsDateString()
  signedAt?: string;

  @ValidateIf((o) => o.signed === true)
  @IsNotEmpty()
  @IsString()
  signedBy?: string;
}
