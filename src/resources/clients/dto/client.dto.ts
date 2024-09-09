import { Expose, Type } from 'class-transformer';
import { ClientType, TaxIdType } from '@prisma/client';
import { ContractDto } from './contract/contract.dto';
import { AddressDto } from './address/address.dto';

export class ClientDto {
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
}
