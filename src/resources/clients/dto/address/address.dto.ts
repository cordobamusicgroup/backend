import { Expose, Transform } from 'class-transformer';

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
  @Transform(({ value }) => value, { toClassOnly: true })
  countryName?: string;

  @Expose()
  zip: string;
}
