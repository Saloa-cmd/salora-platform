"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Gauge, MessageCircle, Receipt, Sparkles, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Executive", icon: Gauge },
  { href: "/dashboard/revenue", label: "Revenue", icon: Receipt },
  { href: "/dashboard/operations", label: "Operations", icon: Sparkles },
  { href: "/dashboard/ai", label: "AI", icon: Bot },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageCircle }
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-black/30 p-4 backdrop-blur-xl lg:block" aria-label="Dashboard navigation">
      <div className="mb-8 rounded-xl border border-[var(--border-gold)] bg-[var(--gold)]/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold-soft)]">SALORA</p>
        <h1 className="mt-2 text-xl font-semibold text-[var(--cream)]">Command Center</h1>
        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">Executive operating visibility for commerce, AI, operations, and channels.</p>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "border-[var(--border-gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]"
                  : "border-transparent text-[var(--muted)] hover:border-white/10 hover:bg-white/5 hover:text-[var(--cream)]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
