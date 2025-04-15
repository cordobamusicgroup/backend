import { Role } from 'src/generated/client';

/**
 * Checks if a given role is an admin role.
 * @param role - The role to check.
 * @returns A boolean indicating whether the role is an admin role or not.
 */
export function isAdminRole(role: Role): boolean {
  const adminRoles: Array<Role> = [
    Role.ADMIN,
    Role.ADMIN_CONTENT,
    Role.ADMIN_LEGAL,
    Role.ADMIN_MANAGER,
  ];
  return adminRoles.includes(role);
}
