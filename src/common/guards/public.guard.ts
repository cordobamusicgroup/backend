import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard to bypass authentication for public routes.
 *
 * The guard checks if the route is marked with the @Public decorator
 * and allows access without authentication if true.
 */
@Injectable()
export class PublicGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current request can proceed without authentication.
   *
   * @param context - The execution context which provides details about the current request.
   * @returns A boolean indicating if the request can proceed without authentication.
   */
  canActivate(context: ExecutionContext): boolean {
    // Check if the route is marked as public using the reflector
    // Allow access if the route is public
    return this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
  }
}
