import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAddressDto } from '../address/dto/update-address.dto';
import { CreateAddressDto } from '../address/dto/create-address.dto';
import { UpdateContractDto } from './contract/update-contract.dto';
import { CreateContractDto } from './contract/create-contract.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsOptional()
  address?: CreateAddressDto;

  @ValidateNested()
  @Type(() => UpdateContractDto)
  @IsOptional()
  contract?: CreateContractDto;
}
