import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * Decorator function that sets the metadata for the roles allowed to access a resource.
 * @param roles The roles allowed to access the resource.
 * @returns A decorator function that sets the metadata for the roles.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
