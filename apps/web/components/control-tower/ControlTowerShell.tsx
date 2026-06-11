"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Coffee, Command, Menu, ShieldCheck } from "lucide-react";
import { controlTowerSections } from "@/lib/control-tower/registry";
import { ControlTowerPerf } from "./ControlTowerPerf";
import { useState, type ReactNode } from "react";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";

const controlTowerGroups: Array<{ label: string; sections: ControlTowerSectionId[] }> = [
  { label: "Overview", sections: ["executive"] },
  { label: "Operations", sections: ["revenue", "orders", "inventory", "customers", "loyalty"] },
  { label: "Content", sections: ["content", "ai", "notifications"] },
  { label: "Channels", sections: ["whatsapp", "instagram"] },
  { label: "System", sections: ["automation", "integrations", "settings"] }
];

export function ControlTowerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const defaultSection = controlTowerSections[0];
  if (!defaultSection) {
    throw new Error("Control Tower registry must include at least one section.");
  }
  const activeSection = controlTowerSections.find((section) => {
    const href = `/control-tower/${section.id}`;
    return pathname === href || (pathname === "/control-tower" && section.id === "executive");
  }) ?? defaultSection;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--cream)]">
      <ControlTowerPerf />
      <a href="#control-tower-content" className="skip-link">Skip to control tower content</a>
      <div className="flex min-h-screen">
        <aside className={`hidden shrink-0 border-r border-[rgba(201,164,92,0.08)] bg-black/40 backdrop-blur-xl transition-all duration-200 xl:flex xl:flex-col ${collapsed ? "w-16" : "w-64"}`} aria-label="Control Tower navigation">
          <Link href="/control-tower" className={`flex h-16 items-center border-b border-[rgba(201,164,92,0.08)] ${collapsed ? "justify-center px-0" : "gap-3 px-5"}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)] text-black">
              <Coffee className="h-4 w-4" aria-hidden="true" />
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-none tracking-wide text-[var(--cream)]">SALORA</span>
                <span className="mt-1 block text-[0.62rem] uppercase leading-none tracking-[0.22em] text-[var(--muted)]">Control Tower</span>
              </span>
            ) : null}
          </Link>
          <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Control Tower sections">
            {controlTowerGroups.map((group) => {
              const sections = group.sections
                .map((id) => controlTowerSections.find((section) => section.id === id))
                .filter(Boolean);
              if (sections.length === 0) return null;

              return (
                <div key={group.label} className="mb-4">
                  {!collapsed ? <p className="px-2 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/20">{group.label}</p> : null}
                  <div className="grid gap-1">
                    {sections.map((section) => {
                      if (!section) return null;
                      const Icon = section.icon;
                      const href = `/control-tower/${section.id}`;
                      const active = pathname === href || (pathname === "/control-tower" && section.id === "executive");

                      return (
                        <Link
                          key={section.id}
                          href={href}
                          aria-current={active ? "page" : undefined}
                          title={collapsed ? section.label : undefined}
                          className={`relative flex items-center rounded-lg text-sm transition ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"} ${
                            active
                              ? "bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                              : "text-[var(--muted)] hover:bg-white/[0.055] hover:text-[var(--cream)]"
                          }`}
                        >
                          {active ? <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--gold)]" /> : null}
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          {!collapsed ? <span className="min-w-0 flex-1 truncate font-semibold">{section.label}</span> : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
          <div className={`border-t border-[rgba(201,164,92,0.08)] p-3 ${collapsed ? "flex justify-center" : ""}`}>
            <div className={`flex items-center rounded-lg px-2 py-2 transition ${collapsed ? "justify-center" : "gap-3 hover:bg-white/[0.055]"}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-gold)] bg-[var(--gold)]/10 text-xs font-semibold text-[var(--gold-soft)]">AD</span>
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[var(--cream)]">Admin</span>
                    <span className="mt-0.5 block truncate text-[0.68rem] text-[var(--muted)]">Role-gated session</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/25" aria-hidden="true" />
                </>
              ) : null}
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[rgba(201,164,92,0.08)] bg-[rgba(5,5,5,0.82)] px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCollapsed((value) => !value)}
                  className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-white/[0.055] hover:text-[var(--cream)] xl:flex"
                  aria-label={collapsed ? "Expand Control Tower navigation" : "Collapse Control Tower navigation"}
                  aria-pressed={collapsed}
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span>Control Tower</span>
                    <span className="text-white/20">/</span>
                    <span className="truncate text-[var(--cream)]">{activeSection.label}</span>
                  </p>
                  <h1 className="mt-1 text-xl font-semibold text-[var(--cream)] sm:text-2xl">No-Code Commerce Operating System</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2 text-xs text-[var(--muted)] md:inline-flex">
                  <Command className="h-3.5 w-3.5" aria-hidden="true" />
                  Search-ready surface
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)]">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
                  Live
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--cream)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--gold-soft)]" aria-hidden="true" />
                  RBAC write gates
                </span>
                <Link href="/dashboard" className="rounded-lg border border-[var(--border-gold)] bg-[var(--gold)]/10 px-3 py-2 text-xs font-semibold text-[var(--gold-soft)] transition hover:bg-[var(--gold)]/15">
                  Executive dashboards
                </Link>
              </div>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:hidden" aria-label="Mobile Control Tower navigation">
              {controlTowerSections.map((section) => {
                const href = `/control-tower/${section.id}`;
                const active = pathname === href || (pathname === "/control-tower" && section.id === "executive");
                return (
                  <Link key={section.id} href={href} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${active ? "border-[var(--border-gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "border-white/10 bg-white/5 text-[var(--muted)]"}`}>
                    {section.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <main id="control-tower-content" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
