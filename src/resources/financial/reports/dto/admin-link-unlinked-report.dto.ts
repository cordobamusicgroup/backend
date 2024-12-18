import { IsInt, IsNotEmpty } from 'class-validator';

export class LinkUnlinkedReportDto {
  @IsInt()
  @IsNotEmpty()
  unlinkedReportId: number;

  @IsInt()
  @IsNotEmpty()
  labelId: number;
}
