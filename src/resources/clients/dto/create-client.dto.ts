import { Expose } from 'class-transformer';
import { ClientType } from '../../../common/enums/client-type.enum';

export class ClientDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  type: ClientType;

  @Expose()
  vatId: string;

  @Expose()
  taxId: string;
}
