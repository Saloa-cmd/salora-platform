import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import type { DashboardMetric, DashboardStatus } from "@/lib/dashboard/types";

const statusClass: Record<DashboardStatus, string> = {
  ok: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  warning: "border-[var(--border-gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]",
  critical: "border-red-300/25 bg-red-300/10 text-red-100",
  empty: "border-white/10 bg-white/5 text-[var(--muted)]",
  unauthorized: "border-red-300/25 bg-red-300/10 text-red-100",
  error: "border-red-300/25 bg-red-300/10 text-red-100"
};

function ChangeIcon({ change }: { change?: string }) {
  if (!change) return <Minus className="h-3.5 w-3.5" aria-hidden="true" />;
  if (change.trim().startsWith("-")) return <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />;
  return <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />;
}

export function KpiCard({ metric }: { metric: DashboardMetric }) {
  const status = metric.status ?? "ok";

  return (
    <DashboardCard className="min-h-36">
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-[var(--muted)]">{metric.label}</p>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] font-semibold uppercase ${statusClass[status]}`}>
            <ChangeIcon change={metric.change} />
            {metric.change ?? status}
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold text-[var(--cream)]">{metric.value}</p>
          {metric.detail ? <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{metric.detail}</p> : null}
        </div>
      </div>
    </DashboardCard>
  );
}
