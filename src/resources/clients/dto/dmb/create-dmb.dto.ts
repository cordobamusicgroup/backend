import { AccessTypeDMB, DMBStatus } from 'generated/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateDmbDto {
  @IsEnum(AccessTypeDMB)
  accessType: AccessTypeDMB;

  @IsEnum(DMBStatus)
  status: DMBStatus;

  @IsString()
  @IsOptional()
  subclientName?: string;

  @IsString()
  @IsOptional()
  username?: string;
}
