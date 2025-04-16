import { LabelRegistrationStatus, LabelStatus } from 'generated/client';
import { Expose, Transform } from 'class-transformer';

export class LabelDto {
  @Expose()
  id: number;

  @Expose()
  clientId: number;

  @Expose()
  status: LabelStatus;

  @Expose()
  name: string;

  @Expose()
  website?: string;

  @Expose()
  countryId?: number;

  @Expose()
  @Transform(({ value }) => value, { toClassOnly: true })
  countryName?: string;

  @Expose()
  beatportStatus?: LabelRegistrationStatus;

  @Expose()
  traxsourceStatus?: LabelRegistrationStatus;

  @Expose()
  beatportUrl?: string;

  @Expose()
  traxsourceUrl?: string;
}
