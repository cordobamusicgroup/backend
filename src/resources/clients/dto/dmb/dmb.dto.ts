import { AccessTypeDMB, DMBStatus } from 'generated/client';
import { Expose } from 'class-transformer';

export class DmbDto {
  @Expose()
  accessType: AccessTypeDMB;

  @Expose()
  status: DMBStatus;

  @Expose()
  subclientName?: string;

  @Expose()
  username?: string;
}
