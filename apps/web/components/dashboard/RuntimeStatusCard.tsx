import { CheckCircle2, CircleDashed, OctagonAlert } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import type { DashboardStatus, RuntimeStatus } from "@/lib/dashboard/types";

const statusTone: Record<DashboardStatus, string> = {
  ok: "text-emerald-200",
  warning: "text-[var(--gold-soft)]",
  critical: "text-red-200",
  empty: "text-[var(--muted)]",
  unauthorized: "text-red-200",
  error: "text-red-200"
};

function StatusIcon({ status }: { status: DashboardStatus }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  if (status === "empty") return <CircleDashed className="h-4 w-4" aria-hidden="true" />;
  return <OctagonAlert className="h-4 w-4" aria-hidden="true" />;
}

export function RuntimeStatusCard({ title, statuses }: { title: string; statuses: RuntimeStatus[] }) {
  return (
    <DashboardCard title={title} eyebrow="Runtime">
      <div className="divide-y divide-white/10">
        {statuses.map((item) => (
          <div key={item.label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span className={`mt-0.5 ${statusTone[item.status]}`}>
              <StatusIcon status={item.status} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--cream)]">{item.label}</p>
              <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
