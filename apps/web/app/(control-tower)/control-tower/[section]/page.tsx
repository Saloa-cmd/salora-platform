import { notFound } from "next/navigation";
import { ControlTowerShell } from "@/components/control-tower/ControlTowerShell";
import { ControlTowerView } from "@/components/control-tower/ControlTowerView";
import { validControlTowerSectionIds } from "@/lib/control-tower/registry";
import { requireControlTowerPageAccess } from "@/lib/server/auth/controlTower";

export const dynamic = "force-dynamic";

export default async function ControlTowerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  await requireControlTowerPageAccess();
  const { section } = await params;

  if (!validControlTowerSectionIds.includes(section as never)) {
    notFound();
  }

  return (
    <ControlTowerShell>
      <ControlTowerView sectionId={section} />
    </ControlTowerShell>
  );
}
