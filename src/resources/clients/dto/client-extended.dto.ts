import { Expose, Type } from 'class-transformer';
import { ClientType, TaxIdType } from '@prisma/client';
import { ContractDto } from './contract/contract.dto';
import { AddressDto } from './address/address.dto';
import { DmbDto } from './dmb/dmb.dto';

export class ClientExtendedDto {
  @Expose()
  id: number;

  @Expose()
  clientName: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  type: ClientType;

  @Expose()
  taxIdType: TaxIdType;

  @Expose()
  taxId: string;

  @Expose()
  vatRegistered?: boolean;

  @Expose()
  vatId: string;

  @Expose()
  @Type(() => AddressDto)
  address: AddressDto;

  @Expose()
  @Type(() => ContractDto)
  contract: ContractDto;

  @Expose()
  @Type(() => DmbDto)
  dmb: DmbDto;
}