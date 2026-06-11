import { DashboardCard } from "./DashboardCard";
import type { TrendPoint } from "@/lib/dashboard/types";

export function TrendCard({ title, points, emptyLabel = "No trend data available" }: { title: string; points: TrendPoint[]; emptyLabel?: string }) {
  const max = Math.max(...points.map((point) => point.value), 0);

  return (
    <DashboardCard title={title} eyebrow="Trend">
      {points.length ? (
        <div className="flex h-52 items-end gap-3" role="img" aria-label={`${title} trend chart`}>
          {points.map((point) => (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end rounded-lg bg-black/20 p-1">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-[var(--gold)] to-[var(--gold-soft)] shadow-lg shadow-[var(--gold)]/10"
                  style={{ height: `${max ? Math.max(8, (point.value / max) * 100) : 0}%` }}
                />
              </div>
              <span className="w-full truncate text-center text-xs text-[var(--muted)]">{point.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-[var(--muted)]">{emptyLabel}</p>
      )}
    </DashboardCard>
  );
}
