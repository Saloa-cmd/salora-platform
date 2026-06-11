import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default function OperationsDashboardPage() {
  return (
    <DashboardShell
      title="Operations Dashboard"
      subtitle="Order volume, queue health, inventory alerts, runtime alerts, payment failures, and system health."
    >
      <DashboardView kind="operations" />
    </DashboardShell>
  );
}
