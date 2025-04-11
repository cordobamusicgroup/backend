import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';

export const GetCurrentUserJwt = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayloadDto; // Retorna directamente el payload JWT
  },
);
