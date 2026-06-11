import { ControlTowerShell } from "@/components/control-tower/ControlTowerShell";
import { ControlTowerView } from "@/components/control-tower/ControlTowerView";
import { requireControlTowerPageAccess } from "@/lib/server/auth/controlTower";

export const dynamic = "force-dynamic";

export default async function ControlTowerPage() {
  await requireControlTowerPageAccess();

  return (
    <ControlTowerShell>
      <ControlTowerView sectionId="executive" />
    </ControlTowerShell>
  );
}
