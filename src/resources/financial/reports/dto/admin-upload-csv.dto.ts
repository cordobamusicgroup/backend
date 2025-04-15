import { Distributor } from 'src/generated/client';

export class UploadCsvDto {
  file: Express.Multer.File;
  reportingMonth: string;
  distributor: Distributor;
}
