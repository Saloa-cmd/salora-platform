"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Command, ExternalLink, Languages, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { controlTowerSections } from "@/lib/control-tower/registry";
import { ControlTowerPerf } from "./ControlTowerPerf";
import { useState, type ReactNode } from "react";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { ControlTowerLocaleProvider, useControlTowerLocale } from "./ControlTowerLocale";

const controlTowerGroups: Array<{ label: string; sections: ControlTowerSectionId[] }> = [
  { label: "Overview", sections: ["executive"] },
  { label: "Operations", sections: ["revenue", "orders", "inventory", "customers", "loyalty"] },
  { label: "Content", sections: ["content", "ai", "notifications"] },
  { label: "Channels", sections: ["whatsapp", "instagram"] },
  { label: "System", sections: ["automation", "integrations", "settings"] }
];

function ControlTowerShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const { isArabic, locale, setLocale, tr } = useControlTowerLocale();
  const defaultSection = controlTowerSections[0];
  if (!defaultSection) {
    throw new Error("Control Tower registry must include at least one section.");
  }
  const activeSection = controlTowerSections.find((section) => {
    const href = `/control-tower/${section.id}`;
    return pathname === href || (pathname === "/control-tower" && section.id === "executive");
  }) ?? defaultSection;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div dir={isArabic ? "rtl" : "ltr"} lang={locale} className={`min-h-screen bg-[var(--background)] text-[var(--cream)] ${isArabic ? "font-sans" : ""}`}>
      <ControlTowerPerf />
      <a href="#control-tower-content" className="skip-link">{tr("Skip to control tower content")}</a>
      <div className="flex min-h-screen">
        {mobileNavigationOpen ? <button type="button" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden" onClick={() => setMobileNavigationOpen(false)} aria-label={tr("Close navigation")} /> : null}
        <aside className={`${mobileNavigationOpen ? "fixed inset-y-0 z-50 flex w-[min(22rem,88vw)] flex-col" : "hidden"} ${isArabic ? "right-0 border-l" : "left-0 border-r"} shrink-0 border-[rgba(201,164,92,0.08)] bg-[#070706]/95 shadow-2xl backdrop-blur-xl transition-all duration-200 xl:static xl:z-auto xl:flex xl:flex-col xl:bg-black/40 xl:shadow-none ${collapsed ? "xl:w-16" : "xl:w-64"}`} aria-label={tr("Control Tower navigation")}>
          <div className={`flex h-16 items-center border-b border-[rgba(201,164,92,0.08)] ${collapsed ? "justify-center px-0" : "gap-3 px-5"}`}>
            <Link href="/control-tower" className="flex min-w-0 flex-1 items-center gap-3" onClick={() => setMobileNavigationOpen(false)}>
              <Image src="/brand/salora-logo-dark.jpeg" alt="SALORA" width={36} height={36} priority className="h-9 w-9 shrink-0 rounded-full border border-[var(--border-gold)] object-cover" />
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-none tracking-wide text-[var(--cream)]">SALORA</span>
                  <span className="mt-1 block text-[0.62rem] uppercase leading-none tracking-[0.22em] text-[var(--muted)]">Control Tower</span>
                </span>
              ) : null}
            </Link>
            <button type="button" onClick={() => setMobileNavigationOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl text-[var(--muted)] hover:bg-white/10 hover:text-[var(--cream)] xl:hidden" aria-label={tr("Close navigation")}><X className="h-5 w-5" aria-hidden="true" /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Control Tower sections">
            {controlTowerGroups.map((group) => {
              const sections = group.sections
                .map((id) => controlTowerSections.find((section) => section.id === id))
                .filter(Boolean);
              if (sections.length === 0) return null;

              return (
                <div key={group.label} className="mb-4">
                  {!collapsed ? <p className="px-2 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/20">{tr(group.label)}</p> : null}
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
                          title={collapsed ? tr(section.label) : undefined}
                          onClick={() => setMobileNavigationOpen(false)}
                          className={`relative flex items-center rounded-lg text-sm transition ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"} ${
                            active
                              ? "bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                              : "text-[var(--muted)] hover:bg-white/[0.055] hover:text-[var(--cream)]"
                          }`}
                        >
                          {active ? <span className={`absolute ${isArabic ? "right-0 rounded-l-full" : "left-0 rounded-r-full"} top-1/2 h-5 w-0.5 -translate-y-1/2 bg-[var(--gold)]`} /> : null}
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          {!collapsed ? <span className="min-w-0 flex-1 truncate font-semibold">{tr(section.label)}</span> : null}
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
                    <span className="block truncate text-xs font-semibold text-[var(--cream)]">{tr("Admin")}</span>
                    <span className="mt-0.5 block truncate text-[0.68rem] text-[var(--muted)]">{tr("Role-gated session")}</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/25" aria-hidden="true" />
                </>
              ) : null}
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[rgba(201,164,92,0.08)] bg-[rgba(5,5,5,0.9)] backdrop-blur-xl">
            <div className="flex min-h-20 flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <button type="button" onClick={() => setMobileNavigationOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-[var(--cream)] xl:hidden" aria-label={tr("Open navigation")} aria-expanded={mobileNavigationOpen}><Menu className="h-5 w-5" aria-hidden="true" /></button>
                <button
                  type="button"
                  onClick={() => setCollapsed((value) => !value)}
                  className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-white/[0.055] hover:text-[var(--cream)] xl:flex"
                  aria-label={tr(collapsed ? "Expand Control Tower navigation" : "Collapse Control Tower navigation")}
                  aria-pressed={collapsed}
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span>{tr("Control Tower")}</span>
                    <span className="text-white/20">/</span>
                    <span className="truncate text-[var(--cream)]">{tr(activeSection.label)}</span>
                  </p>
                  <h1 className="salora-page-title mt-1 max-w-[24ch] font-semibold text-[var(--cream)]">{tr("No-Code Commerce Operating System")}</h1>
                </div>
              </div>
              <div className="salora-command-bar max-w-full pb-1 lg:justify-end lg:pb-0" aria-label={tr("Control Tower commands")}>
                <span className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2 text-xs text-[var(--muted)] 2xl:inline-flex">
                  <Command className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr("Search-ready surface")}
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)]">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
                  {tr("Live")}
                </span>
                <span className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--cream)] lg:inline-flex">
                  <ShieldCheck className="h-4 w-4 text-[var(--gold-soft)]" aria-hidden="true" />
                  {tr("RBAC write gates")}
                </span>
                <Link href="/dashboard" className="hidden rounded-lg border border-[var(--border-gold)] bg-[var(--gold)]/10 px-3 py-2 text-xs font-semibold text-[var(--gold-soft)] transition hover:bg-[var(--gold)]/15 lg:block">
                  {tr("Executive dashboards")}
                </Link>
                <Link href="/menu" target="_blank" className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--cream)] transition hover:bg-white/10 sm:inline-flex">
                  {tr("Customer menu")} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <button type="button" onClick={() => setLocale(isArabic ? "en" : "ar")} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--cream)] transition hover:bg-white/10" aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}>
                  <Languages className="h-3.5 w-3.5" aria-hidden="true" /> {isArabic ? "English" : "العربية"}
                </button>
                <div>
                  <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-lg border border-red-300/15 bg-red-300/5 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-300/10">
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> {isArabic ? "تسجيل الخروج" : "Sign out"}
                  </button>
                </div>
              </div>
            </div>
            <nav className="salora-scroll-strip border-t border-white/[0.06] px-4 py-2 sm:px-6 xl:hidden" aria-label={tr("Mobile Control Tower navigation")}>
              {controlTowerSections.map((section) => {
                const href = `/control-tower/${section.id}`;
                const active = pathname === href || (pathname === "/control-tower" && section.id === "executive");
                return (
                  <Link key={section.id} href={href} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${active ? "border-[var(--border-gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "border-white/10 bg-white/5 text-[var(--muted)]"}`}>
                    {tr(section.label)}
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

export function ControlTowerShell({ children }: { children: ReactNode }) {
  return <ControlTowerLocaleProvider><ControlTowerShellContent>{children}</ControlTowerShellContent></ControlTowerLocaleProvider>;
}
