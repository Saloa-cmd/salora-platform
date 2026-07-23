"use client";

import Link from "next/link";
import { ArrowUpLeft, CheckCircle2, CircleDashed, LockKeyhole, Wrench } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { ControlCapability, ControlTowerStatus } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";

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
  const { tr } = useControlTowerLocale();
  const href = capability.href
    ?? (capability.status === "live" || capability.status === "configured" ? "#no-code-workspace" : undefined);
  const actionLabel = capability.actionLabel ?? "Open workspace";
  const card = (
    <DashboardCard>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[var(--cream)]">{tr(capability.title)}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{tr(capability.description)}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold-soft)]">{tr(capability.owner)}</p>
          {href ? (
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold-soft)]">
              {tr(actionLabel)}
              <ArrowUpLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </span>
          ) : (
            <span className="mt-4 block text-xs font-semibold text-[var(--muted)]">{tr("Not available yet")}</span>
          )}
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] font-semibold uppercase ${statusClass[capability.status]}`}>
          <StatusIcon status={capability.status} />
          {tr(statusLabel[capability.status])}
        </span>
      </div>
    </DashboardCard>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="block rounded-xl outline-none transition hover:-translate-y-0.5 hover:[&>article]:border-[var(--border-gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
      aria-label={tr(actionLabel)}
    >
      {card}
    </Link>
  );
}
