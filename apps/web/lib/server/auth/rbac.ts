import type { RoleName } from "./types";

export const rolePermissions: Record<RoleName, string[]> = {
  CUSTOMER: ["order:read:self", "order:create:self"],
  STAFF: ["order:read", "order:update", "catalog:read"],
  MANAGER: ["order:read", "order:update", "catalog:read", "catalog:write", "staff:read"],
  ADMIN: ["order:*", "catalog:*", "staff:*", "user:*", "system:*"]
};

export function hasRole(userRoles: RoleName[], allowedRoles: RoleName[]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function hasPermission(userRoles: RoleName[], permission: string): boolean {
  return userRoles.some((role) => {
    const permissions = rolePermissions[role];
    const [domain] = permission.split(":");
    return permissions.includes(permission) || permissions.includes(`${domain}:*`) || permissions.includes("system:*");
  });
}

export function assertRole(userRoles: RoleName[], allowedRoles: RoleName[]): void {
  if (!hasRole(userRoles, allowedRoles)) {
    throw new Error("Forbidden: role is not allowed for this operation.");
  }
}
