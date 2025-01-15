
import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetBaseReportDto {
  @IsInt()
  id: number;

  @IsString()
  distributor: string;

  @IsString()
  reportingMonth: string;

  @IsString()
  currency: string;

  @IsInt()
  totalRoyalties: number;

  @IsInt()
  totalEarnings: number;

  @IsOptional()
  @IsString()
  url?: string;
}