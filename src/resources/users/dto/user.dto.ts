import { Expose, Type } from 'class-transformer';
import { ClientExtendedDto } from '../../clients/dto/client-extended.dto';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  role: string;

  @Type(() => ClientExtendedDto)
  @Expose()
  client: ClientExtendedDto;
}
