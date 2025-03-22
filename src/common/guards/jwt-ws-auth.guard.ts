import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(JwtWsAuthGuard.name);

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

    try {
      const client = context.switchToWs().getClient();
      const authHeader = client.handshake?.headers?.authorization;

      if (!authHeader) {
        this.logger.warn(
          'WebSocket connection attempt without authorization header',
        );
        throw new WsException('Authorization header is missing');
      }

      const authParts = authHeader.split(' ');
      if (authParts.length !== 2 || authParts[0] !== 'Bearer') {
        this.logger.warn(
          'Invalid authorization format in WebSocket connection',
        );
        throw new WsException('Invalid authorization format');
      }

      const authToken = authParts[1];
      if (!authToken) {
        this.logger.warn('WebSocket connection attempt with empty token');
        throw new WsException('Empty token provided');
      }

      const request = context.switchToHttp().getRequest();
      request.headers = request.headers || {};
      request.headers.authorization = `Bearer ${authToken}`;

      // Proceed with JWT authentication if the route is not public
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      this.logger.error(`WebSocket authentication error: ${error.message}`);
      throw new WsException(error.message || 'Unauthorized');
    }
  }

  /**
   * Handle the request and provide custom error message if unauthorized.
   * @param err - The error encountered during authentication.
   * @param user - The authenticated user, if any.
   * @returns The authenticated user or throws a custom unauthorized exception.
   */
  handleRequest(err: any, user: any) {
    if (err) {
      this.logger.error(`JWT validation error: ${err.message}`);
      throw new WsException('Authentication failed');
    }

    if (!user) {
      this.logger.warn('JWT validation succeeded but no user was returned');
      throw new WsException('User not found');
    }

    return user;
  }
}
