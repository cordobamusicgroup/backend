import { Expose } from 'class-transformer';

export class AddressDto {
  @Expose()
  street: string;

  @Expose()
  city: string;

  @Expose()
  state: string;

  @Expose()
  countryId: number;

  @Expose()
  zip: string;
}
