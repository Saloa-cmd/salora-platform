import { notFound, redirect } from "next/navigation";
import { ControlTowerShell } from "@/components/control-tower/ControlTowerShell";
import { ControlTowerView } from "@/components/control-tower/ControlTowerView";
import { legacyControlTowerSectionAliases, validControlTowerSectionIds } from "@/lib/control-tower/registry";
import { requireControlTowerPageAccess } from "@/lib/server/auth/controlTower";
import { visibleControlTowerSections } from "@/lib/server/controlTowerNavigation";
import type { RoleName } from "@/lib/server/auth/types";

export const dynamic = "force-dynamic";

export default async function ControlTowerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const actor = await requireControlTowerPageAccess();
  const roles = actor.roles as RoleName[];
  const visibleSections = visibleControlTowerSections(roles);
  const { section } = await params;

  const legacyTarget = legacyControlTowerSectionAliases[section];
  if (legacyTarget) redirect(`/control-tower/${legacyTarget}`);

  if (!validControlTowerSectionIds.includes(section as never) || !visibleSections.includes(section as never)) {
    notFound();
  }

  return (
    <ControlTowerShell visibleSections={visibleSections} actor={{ email: actor.email, roles }}>
      <ControlTowerView sectionId={section} />
    </ControlTowerShell>
  );
}
