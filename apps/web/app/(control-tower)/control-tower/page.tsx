import { ControlTowerShell } from "@/components/control-tower/ControlTowerShell";
import { ControlTowerView } from "@/components/control-tower/ControlTowerView";
import { requireControlTowerPageAccess } from "@/lib/server/auth/controlTower";
import { visibleControlTowerSections } from "@/lib/server/controlTowerNavigation";
import type { RoleName } from "@/lib/server/auth/types";

export const dynamic = "force-dynamic";

export default async function ControlTowerPage() {
  const actor = await requireControlTowerPageAccess();
  const roles = actor.roles as RoleName[];
  const visibleSections = visibleControlTowerSections(roles);

  return (
    <ControlTowerShell visibleSections={visibleSections} actor={{ email: actor.email, roles }}>
      <ControlTowerView sectionId="overview" />
    </ControlTowerShell>
  );
}
