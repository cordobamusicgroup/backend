import { Distributor } from '@prisma/client';

export class UploadCsvDto {
  file: Express.Multer.File;
  reportingMonth: string;
  distributor: Distributor;
}
