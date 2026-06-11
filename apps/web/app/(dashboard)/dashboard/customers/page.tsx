import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default function CustomersDashboardPage() {
  return (
    <DashboardShell
      title="Customer Dashboard"
      subtitle="Customer health, loyalty engagement, retention readiness, churn risk, recommendation acceptance, and value segments."
    >
      <DashboardView kind="customers" />
    </DashboardShell>
  );
}
