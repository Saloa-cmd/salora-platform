"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const mobileItems = [
  { href: "/dashboard", label: "Executive" },
  { href: "/dashboard/revenue", label: "Revenue" },
  { href: "/dashboard/operations", label: "Ops" },
  { href: "/dashboard/ai", label: "AI" },
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" }
];

export function DashboardTopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(5,5,5,0.78)] px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold-soft)]">Executive Command Center</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--cream)] sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--cream)]">
            <ShieldCheck className="h-4 w-4 text-[var(--gold-soft)]" aria-hidden="true" />
            RBAC protected
          </span>
          <span className="rounded-full border border-[var(--border-gold)] bg-[var(--gold)]/10 px-3 py-2 text-xs font-semibold text-[var(--gold-soft)]">
            Live API adapters
          </span>
        </div>
      </div>
      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Mobile dashboard navigation">
        {mobileItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                active
                  ? "border-[var(--border-gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]"
                  : "border-white/10 bg-white/5 text-[var(--muted)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
