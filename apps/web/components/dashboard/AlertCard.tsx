import { AlertTriangle, Info, Siren } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import type { DashboardAlert } from "@/lib/dashboard/types";

function AlertIcon({ severity }: { severity: DashboardAlert["severity"] }) {
  if (severity === "critical") return <Siren className="h-4 w-4 text-red-200" aria-hidden="true" />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4 text-[var(--gold-soft)]" aria-hidden="true" />;
  return <Info className="h-4 w-4 text-sky-200" aria-hidden="true" />;
}

export function AlertCard({ title, alerts }: { title: string; alerts: DashboardAlert[] }) {
  return (
    <DashboardCard title={title} eyebrow="Alerts">
      <div className="space-y-3">
        {alerts.length ? alerts.map((alert) => (
          <div key={alert.id} className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mt-0.5">
              <AlertIcon severity={alert.severity} />
            </div>
            <div className="min-w-0">
              <p className="capitalize text-sm font-semibold text-[var(--cream)]">{alert.title}</p>
              <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{alert.detail}</p>
            </div>
          </div>
        )) : (
          <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-[var(--muted)]">No active alerts returned by SALORA intelligence.</p>
        )}
      </div>
    </DashboardCard>
  );
}
