// create-client.dto.ts
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClientType, TaxIdType } from '@prisma/client';
import { CreateAddressDto } from '../address/dto/create-address.dto';

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
  @IsOptional()
  vatRegistered?: boolean;

  @IsString()
  @IsOptional()
  vatId?: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  address?: CreateAddressDto;
}
