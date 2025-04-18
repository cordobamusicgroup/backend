import { Expose, Type } from 'class-transformer';
import { ClientType, TaxIdType } from 'generated/client';
import { AddressDto } from './address/address.dto';

export class ClientBasicDto {
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
  isBlocked: boolean;

  @Expose()
  isPaymentsBlocked: boolean;

  @Expose()
  isPaymentInProgress: boolean;

  @Expose()
  isPaymentDataInValidation: boolean;
}
