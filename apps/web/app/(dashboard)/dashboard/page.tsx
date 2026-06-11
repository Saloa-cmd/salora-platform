import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Executive Dashboard"
      subtitle="Revenue, operations, AI, customers, loyalty, WhatsApp readiness, runtime health, and alerts in one operating view."
    >
      <DashboardView kind="executive" />
    </DashboardShell>
  );
}
