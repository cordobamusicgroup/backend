import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { Role } from '../enums/role.enum';

/**
 * Guard to handle role-based access control.
 *
 * The guard checks if the route is marked with the required roles
 * and allows access if the user's role matches one of the required roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current request has the necessary roles to proceed.
   *
   * @param context - The execution context which provides details about the current request.
   * @returns A boolean indicating if the request can proceed based on the user's roles.
   */
  canActivate(context: ExecutionContext): boolean {
    // Retrieve the required roles from the decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get the user from the request object
    const { user } = context.switchToHttp().getRequest();

    // Check if the user's role is included in the required roles
    return requiredRoles.includes(user.role);
  }
}
