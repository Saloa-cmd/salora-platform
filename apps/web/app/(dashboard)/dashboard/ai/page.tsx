import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default function AiDashboardPage() {
  return (
    <DashboardShell
      title="AI Dashboard"
      subtitle="Provider usage, cost estimate, latency availability, fallback readiness, evaluation quality, safety blocks, and recommendation performance."
    >
      <DashboardView kind="ai" />
    </DashboardShell>
  );
}
