import type { RoleName } from "./types";

export const controlTowerAllowedRoles: RoleName[] = ["STAFF", "MANAGER", "ADMIN"];

export function canAccessControlTower(roles: RoleName[]): boolean {
  return roles.some((role) => controlTowerAllowedRoles.includes(role));
}
