import { ContractStatus, ContractType } from 'generated/client';
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
  type: ContractType;

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

  @IsOptional()
  @IsDateString()
  signedAt?: string;

  @IsOptional()
  @IsString()
  signedBy?: string;
}
