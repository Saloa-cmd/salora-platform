"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { RoleName } from "@/lib/server/auth/types";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { controlTowerNavigationGroups, controlTowerSections } from "@/lib/control-tower/registry";
import { SaloraIcon } from "@/components/ui/SaloraIcon";
import { ThemeControl } from "@/components/ui/ThemeControl";
import { ControlTowerLocaleProvider, useControlTowerLocale } from "./ControlTowerLocale";
import { ControlTowerCommandPalette } from "./ControlTowerCommandPalette";
import { ControlTowerPerf } from "./ControlTowerPerf";

type ShellProps = { children: ReactNode; visibleSections: ControlTowerSectionId[]; actor: { email: string; roles: RoleName[] } };

function ShellContent({ children, visibleSections, actor }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isArabic, locale, setLocale, tr } = useControlTowerLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const sections = controlTowerSections.filter((section) => visibleSections.includes(section.id));
  const active = sections.find((section) => pathname === `/control-tower/${section.id}`) ?? sections[0];
  const navigationGroups = controlTowerNavigationGroups.map((group) => ({
    ...group,
    sections: sections.filter((section) => (group.sections as readonly string[]).includes(section.id))
  })).filter((group) => group.sections.length > 0);

  async function signOut() { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); router.replace("/login"); router.refresh(); }

  return (
    <div dir={isArabic ? "rtl" : "ltr"} lang={locale} className="control-tower-app min-h-screen bg-[var(--background)] text-[var(--cream)]">
      <ControlTowerPerf />
      <ControlTowerCommandPalette visibleSections={visibleSections} open={paletteOpen} onOpenChange={setPaletteOpen} />
      <a href="#control-tower-content" className="skip-link">{tr("Skip to control tower content")}</a>
      <div className="flex min-h-screen">
        {mobileOpen ? <button type="button" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden" onClick={() => setMobileOpen(false)} aria-label={tr("Close navigation")} /> : null}
        <aside className={`${mobileOpen ? `fixed inset-y-0 z-50 flex w-[min(20rem,88vw)] ${isArabic ? "right-0" : "left-0"}` : "hidden"} ${collapsed ? "xl:w-[4.75rem]" : "xl:w-[17rem]"} flex-col border-e border-white/[0.07] bg-[color:var(--surface)] transition-[width] xl:sticky xl:top-0 xl:flex xl:h-screen`} aria-label={tr("Control Tower navigation")}>
          <div className="flex min-h-20 items-center gap-3 border-b border-white/[0.07] px-4">
            <Link href="/control-tower" className="flex min-w-0 flex-1 items-center gap-3" onClick={() => setMobileOpen(false)}>
              <Image src="/brand/salora-logo-dark.jpeg" alt="SALORA" width={40} height={40} priority className="h-10 w-10 shrink-0 rounded-full border border-[var(--border-gold)] object-cover" />
              {!collapsed ? <span><strong className="block text-sm tracking-[0.12em]">SALORA</strong><span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Control Tower</span></span> : null}
            </Link>
            <button type="button" onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl text-[var(--muted)] xl:hidden" aria-label={tr("Close navigation")}><SaloraIcon name="close" className="h-5 w-5" /></button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3" aria-label={tr("Primary navigation")}>
            <p className={`${collapsed ? "sr-only" : "px-3 pb-2 pt-1"} text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]`}>{tr("Workspace")}</p>
            <div className="grid gap-1.5">
              {navigationGroups.map((group) => {
                const groupActive = group.sections.some((section) => pathname === `/control-tower/${section.id}`)
                  || (pathname === "/control-tower" && group.key === "overview");
                const target = group.sections[0];
                if (!target) return null;
                return <div key={group.key} className={groupActive && !collapsed ? "rounded-xl bg-white/[0.025] pb-1" : undefined}>
                  <Link href={`/control-tower/${target.id}`} aria-current={groupActive ? "page" : undefined} title={collapsed ? tr(group.label) : undefined} onClick={() => setMobileOpen(false)} className={`group relative flex min-h-11 items-center rounded-xl ${collapsed ? "justify-center" : "gap-3 px-3"} ${groupActive ? "bg-[var(--gold)]/12 text-[var(--gold-soft)]" : "text-[var(--muted)] hover:bg-white/[0.05] hover:text-[var(--cream)]"}`}>
                    {groupActive ? <span className="absolute inset-y-3 start-0 w-0.5 rounded-full bg-[var(--gold)]" /> : null}
                    <SaloraIcon name={group.icon} className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed ? <span className="truncate text-sm font-medium">{tr(group.label)}</span> : null}
                  </Link>
                  {groupActive && !collapsed && group.sections.length > 1 ? <div className="ms-5 mt-1 grid border-s border-white/[0.08] ps-3">
                    {group.sections.map((section) => {
                      const current = pathname === `/control-tower/${section.id}`;
                      return <Link key={section.id} href={`/control-tower/${section.id}`} onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2 text-xs transition ${current ? "text-[var(--gold-soft)]" : "text-[var(--muted)] hover:text-[var(--cream)]"}`}>{tr(section.label)}</Link>;
                    })}
                  </div> : null}
                </div>;
              })}
            </div>
          </nav>
          <div className="border-t border-white/[0.07] p-3">
            <div className={`flex min-h-12 items-center rounded-xl bg-white/[0.035] ${collapsed ? "justify-center" : "gap-3 px-3"}`}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--gold)]/15 text-xs font-bold text-[var(--gold-soft)]">{actor.email.slice(0, 2).toUpperCase()}</span>
              {!collapsed ? <span className="min-w-0"><span className="block truncate text-xs font-semibold">{actor.email}</span><span className="block truncate text-[10px] text-[var(--muted)]">{actor.roles.join(" · ")}</span></span> : null}
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[var(--backdrop)] backdrop-blur-xl">
            <div className="salora-command-bar flex min-h-20 items-center gap-3 px-4 sm:px-6">
              <button type="button" onClick={() => setMobileOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 xl:hidden" aria-label={tr("Open navigation")}><SaloraIcon name="menu" className="h-5 w-5" /></button>
              <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--muted)] hover:bg-white/[0.05] xl:grid" aria-label={tr(collapsed ? "Expand navigation" : "Collapse navigation")}><SaloraIcon name="menu" className="h-5 w-5" /></button>
              <div className="min-w-0 flex-1"><p className="truncate text-xs text-[var(--muted)]">{tr("Control Tower")} <span className="px-1 text-white/20">/</span> <span className="text-[var(--cream)]">{tr(active?.label ?? "Overview")}</span></p><p className="salora-page-title mt-1 truncate text-sm font-semibold sm:text-base">{tr(active?.commandLabel ?? "Open overview")}</p></div>
              <button type="button" onClick={() => setPaletteOpen(true)} className="hidden min-h-11 min-w-64 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-start text-xs text-[var(--muted)] transition hover:border-[var(--border-gold)] md:flex"><SaloraIcon name="search" className="h-4 w-4" /><span className="flex-1">{tr("Search or run a command")}</span><kbd className="rounded border border-white/10 px-1.5 py-1">⌘K</kbd></button>
              <button type="button" onClick={() => setPaletteOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 md:hidden" aria-label={tr("Search and commands")}><SaloraIcon name="search" className="h-5 w-5" /></button>
              <ThemeControl locale={locale} />
              <button type="button" onClick={() => setLocale(isArabic ? "en" : "ar")} className="grid h-11 min-w-11 place-items-center rounded-xl border border-white/10 px-2 text-xs font-semibold" aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}><SaloraIcon name="language" className="h-4 w-4" /><span className="sr-only">{isArabic ? "English" : "العربية"}</span></button>
              <button type="button" className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-[var(--muted)]" aria-label={tr("Notifications")}><SaloraIcon name="bell" className="h-4 w-4" /></button>
              <button type="button" onClick={() => void signOut()} className="hidden min-h-11 rounded-xl border border-white/10 px-3 text-xs text-[var(--muted)] hover:text-[var(--cream)] sm:block">{tr("Sign out")}</button>
            </div>
          </header>
          <main id="control-tower-content" className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function ControlTowerShell(props: ShellProps) { return <ControlTowerLocaleProvider><ShellContent {...props} /></ControlTowerLocaleProvider>; }
