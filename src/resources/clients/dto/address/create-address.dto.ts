import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  street: string;

  @IsString()
  @IsOptional()
  street2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsInt()
  countryId: number;

  @IsString()
  zip: string;
}
