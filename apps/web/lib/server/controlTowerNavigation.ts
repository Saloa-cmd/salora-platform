import "server-only";
import { controlTowerSections } from "@/lib/control-tower/registry";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { hasPermission } from "@/lib/server/auth/rbac";
import type { RoleName } from "@/lib/server/auth/types";

export function visibleControlTowerSections(roles: RoleName[]): ControlTowerSectionId[] { return controlTowerSections.filter((section) => hasPermission(roles, section.readPermission)).map((section) => section.id); }
