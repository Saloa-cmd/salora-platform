import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default function RevenueDashboardPage() {
  return (
    <DashboardShell
      title="Revenue Dashboard"
      subtitle="Gross revenue, net revenue, AOV, refunds, failed payments, channel contribution, payment health, and revenue momentum."
    >
      <DashboardView kind="revenue" />
    </DashboardShell>
  );
}
