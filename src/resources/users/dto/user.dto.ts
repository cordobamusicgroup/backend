import { Expose, Type } from 'class-transformer';
import { ClientDto } from '../../clients/dto/client.dto';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  role: string;

  @Type(() => ClientDto)
  @Expose()
  client: ClientDto;
}
