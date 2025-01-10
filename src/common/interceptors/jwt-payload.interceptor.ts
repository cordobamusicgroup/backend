import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';

@Injectable()
export class JwtPayloadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayloadDto = request.user;
    request.jwtPayload = user;
    return next.handle();
  }
}
