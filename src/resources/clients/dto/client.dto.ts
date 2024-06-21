import { Expose } from 'class-transformer';

export class ClientDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  type: string;

  @Expose()
  vatId: string;

  @Expose()
  taxId: string;
}
