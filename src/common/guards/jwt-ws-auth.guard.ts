import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Custom JWT authentication guard for WebSocket that extends the built-in AuthGuard provided by NestJS.
 * This guard is responsible for authenticating WebSocket connections using JSON Web Tokens (JWT).
 */
@Injectable()
export class JwtWsAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the current request can be activated.
   * If the route is marked as public, the request is allowed without authentication.
   * If the route is not public, the request is authenticated using JWT.
   * @param context - The execution context of the request.
   * @returns A promise that resolves to a boolean indicating if the request can be activated.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const client = context.switchToWs().getClient();
    const authToken = client.handshake?.headers?.authorization?.split(' ')[1];

    if (!authToken) {
      throw new WsException('Unauthorized');
    }

    const request = context.switchToHttp().getRequest();
    request.headers = request.headers || {};
    request.headers.authorization = `Bearer ${authToken}`;

    // Proceed with JWT authentication if the route is not public
    return (await super.canActivate(context)) as boolean;
  }

  /**
   * Handle the request and provide custom error message if unauthorized.
   * @param err - The error encountered during authentication.
   * @param user - The authenticated user, if any.
   * @param info - Additional information about the authentication process.
   * @returns The authenticated user or throws a custom unauthorized exception.
   */
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new WsException('Unauthorized');
    }
    return user;
  }
}
