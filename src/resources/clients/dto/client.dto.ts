import { Expose } from 'class-transformer';
import { AddressDto } from '../address/dto/address.dto';
import { ClientType, TaxIdType } from '@prisma/client';

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
  address?: AddressDto;
}
