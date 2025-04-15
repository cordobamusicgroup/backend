import { LabelRegistrationStatus, LabelStatus } from 'src/generated/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLabelDto {
  @IsNumber()
  clientId: number;

  @IsEnum(LabelStatus)
  status: LabelStatus;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsNumber()
  @IsOptional()
  countryId?: number;

  @IsEnum(LabelRegistrationStatus)
  @IsOptional()
  beatportStatus?: LabelRegistrationStatus;

  @IsEnum(LabelRegistrationStatus)
  @IsOptional()
  traxsourceStatus?: LabelRegistrationStatus;

  @IsString()
  @IsOptional()
  beatportUrl?: string;

  @IsString()
  @IsOptional()
  traxsourceUrl?: string;
}
