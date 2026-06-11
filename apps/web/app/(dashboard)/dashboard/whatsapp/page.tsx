import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default function WhatsappDashboardPage() {
  return (
    <DashboardShell
      title="WhatsApp Dashboard"
      subtitle="Channel readiness, webhook health, response latency availability, AI-assisted replies, order assistance, and loyalty assistance."
    >
      <DashboardView kind="whatsapp" />
    </DashboardShell>
  );
}
