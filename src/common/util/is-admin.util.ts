import { Role } from '@prisma/client';

export function isAdminRole(role: Role): boolean {
  const adminRoles: Array<Role> = [
    Role.ADMIN,
    Role.ADMIN_CONTENT,
    Role.ADMIN_LEGAL,
    Role.ADMIN_MANAGER,
  ];
  return adminRoles.includes(role);
}
