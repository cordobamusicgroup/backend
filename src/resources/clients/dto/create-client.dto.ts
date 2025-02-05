// create-client.dto.ts
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsNotEmptyObject,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClientType, TaxIdType } from '@prisma/client';
import { CreateContractDto } from './contract/create-contract.dto';
import { CreateAddressDto } from './address/create-address.dto';
import { CreateDmbDto } from './dmb/create-dmb.dto';

export class CreateClientDto {
  @IsString()
  clientName: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(ClientType)
  type: ClientType;

  @IsEnum(TaxIdType)
  taxIdType: TaxIdType;

  @IsString()
  taxId: string;

  @IsBoolean()
  vatRegistered: boolean;

  @IsString()
  @IsOptional()
  vatId?: string;

  @IsInt()
  @IsOptional()
  generalContactId?: number;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsNotEmptyObject()
  address: CreateAddressDto;

  @ValidateNested()
  @Type(() => CreateDmbDto)
  @IsNotEmptyObject()
  dmb: CreateDmbDto;

  @ValidateNested()
  @Type(() => CreateContractDto)
  @IsNotEmptyObject()
  contract: CreateContractDto;
}
