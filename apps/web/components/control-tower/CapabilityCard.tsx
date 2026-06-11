import { CheckCircle2, CircleDashed, LockKeyhole, Wrench } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { ControlCapability, ControlTowerStatus } from "@/lib/control-tower/types";

const statusLabel: Record<ControlTowerStatus, string> = {
  live: "Live",
  configured: "Configured",
  "needs-backend": "Needs backend",
  restricted: "Restricted"
};

const statusClass: Record<ControlTowerStatus, string> = {
  live: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  configured: "border-[var(--border-gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]",
  "needs-backend": "border-white/10 bg-white/5 text-[var(--muted)]",
  restricted: "border-red-300/25 bg-red-300/10 text-red-100"
};

function StatusIcon({ status }: { status: ControlTowerStatus }) {
  if (status === "live") return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  if (status === "configured") return <Wrench className="h-4 w-4" aria-hidden="true" />;
  if (status === "restricted") return <LockKeyhole className="h-4 w-4" aria-hidden="true" />;
  return <CircleDashed className="h-4 w-4" aria-hidden="true" />;
}

export function CapabilityCard({ capability }: { capability: ControlCapability }) {
  return (
    <DashboardCard>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[var(--cream)]">{capability.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{capability.description}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold-soft)]">{capability.owner}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] font-semibold uppercase ${statusClass[capability.status]}`}>
          <StatusIcon status={capability.status} />
          {statusLabel[capability.status]}
        </span>
      </div>
    </DashboardCard>
  );
}
