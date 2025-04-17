import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAddressDto } from './address/update-address.dto';
import { UpdateContractDto } from './contract/update-contract.dto';
import { UpdateDmbDto } from './dmb/update-dmb.dto';
import { ClientType, TaxIdType } from 'generated/client';

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(ClientType)
  @IsOptional()
  type?: ClientType;

  @IsEnum(TaxIdType)
  @IsOptional()
  taxIdType?: TaxIdType;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsBoolean()
  @IsOptional()
  vatRegistered?: boolean;

  @IsString()
  @IsOptional()
  vatId?: string;

  @IsInt()
  @IsOptional()
  generalContactId?: number;

  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsOptional()
  address?: UpdateAddressDto;

  @ValidateNested()
  @Type(() => UpdateContractDto)
  @IsOptional()
  contract?: UpdateContractDto;

  @ValidateNested()
  @Type(() => UpdateDmbDto)
  @IsOptional()
  dmb?: UpdateDmbDto;
}
