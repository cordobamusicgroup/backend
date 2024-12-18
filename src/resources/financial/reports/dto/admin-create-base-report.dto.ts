import { IsEnum, IsString, Matches } from 'class-validator';
import { Distributor } from '@prisma/client';

export class CreateBaseReportDto {
  @IsEnum(Distributor)
  distributor: Distributor;

  @IsString()
  @Matches(/^\d{4}(0[1-9]|1[0-2])$/, {
    message: 'Invalid reportingMonth format. Expected format is YYYYMM.',
  })
  reportingMonth: string;
}
