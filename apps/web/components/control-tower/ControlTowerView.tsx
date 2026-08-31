"use client";

import { useState, type ReactNode } from "react";
import { SaloraIcon } from "@/components/ui/SaloraIcon";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ExperienceDesignStudio } from "./ExperienceDesignStudio";
import { LoyaltyActionPanel, RuntimeConfigActionPanel } from "./NoCodeActionPanel";
import { MarketingOperationsWorkspace } from "./MarketingOperationsWorkspace";
import { SimpleLaunchOperationsCenter } from "./SimpleLaunchOperationsCenter";
import { SupremacyCommandCenter } from "./SupremacyCommandCenter";
import { WhatsAppCommandCenter } from "./WhatsAppCommandCenter";
import { OperationalGovernanceCenter } from "./OperationalGovernanceCenter";
import { ControlTowerIntelligenceWorkspace } from "./ControlTowerIntelligenceWorkspace";
import { ControlTowerHome } from "./ControlTowerHome";
import { CatalogWorkspace } from "./CatalogWorkspace";
import { findControlTowerSection } from "@/lib/control-tower/registry";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";

// CatalogWorkspace composes ProductReadinessWorkspace and the governed media,
// review, publishing, and product-settings tools behind progressive disclosure.
function SectionTabs({ label, tabs }: { label: string; tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [selected, setSelected] = useState(tabs[0]?.id ?? "");
  const active = tabs.some((tab) => tab.id === selected) ? selected : tabs[0]?.id;
  const moveFocus = (current: number, key: string, container: HTMLElement) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
    const next = key === "Home" ? 0 : key === "End" ? tabs.length - 1 : (current + (key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setSelected(tabs[next]?.id ?? "");
    (container.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]')[next])?.focus();
  };

  return <div className="grid gap-5">
    <div className="salora-scroll-strip rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-1.5" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => <button key={tab.id} id={`section-tab-${tab.id}`} type="button" role="tab" aria-controls={`section-panel-${tab.id}`} aria-selected={active === tab.id} tabIndex={active === tab.id ? 0 : -1} onClick={() => setSelected(tab.id)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) event.preventDefault(); moveFocus(index, event.key, event.currentTarget); }} className={`inline-flex min-h-11 shrink-0 items-center rounded-xl px-4 text-sm font-semibold transition ${active === tab.id ? "bg-[var(--gold)] text-[#17120a]" : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--cream)]"}`}>{tab.label}</button>)}
    </div>
    {tabs.map((tab) => active === tab.id ? <div key={tab.id} id={`section-panel-${tab.id}`} role="tabpanel" aria-labelledby={`section-tab-${tab.id}`} tabIndex={0}>{tab.content}</div> : null)}
  </div>;
}

function DomainWorkspace({ sectionId }: { sectionId: ControlTowerSectionId }) {
  const { isArabic } = useControlTowerLocale();
  const t = (ar: string, en: string) => isArabic ? ar : en;

  if (sectionId === "overview") return <ControlTowerHome />;
  if (sectionId === "experience") return <ExperienceDesignStudio />;
  if (sectionId === "menu") return <CatalogWorkspace />;
  if (sectionId === "orders") return <SectionTabs label={t("أدوات الطلبات", "Order tools")} tabs={[
    { id: "queue", label: t("الطلبات", "Orders"), content: <DashboardView kind="operations" /> },
    { id: "command", label: t("مركز المتابعة", "Command center"), content: <SupremacyCommandCenter /> }
  ]} />;
  if (sectionId === "customers") return <SectionTabs label={t("أدوات العملاء", "Customer tools")} tabs={[
    { id: "customers", label: t("العملاء", "Customers"), content: <DashboardView kind="customers" /> },
    { id: "loyalty", label: t("الولاء", "Loyalty"), content: <LoyaltyActionPanel /> }
  ]} />;
  if (sectionId === "marketing") return <MarketingOperationsWorkspace />;
  if (sectionId === "ai") return <SectionTabs label={t("أدوات سالورا الذكية", "SALORA AI tools")} tabs={[
    { id: "assistant", label: t("أدوات المساعد", "Assistant tools"), content: <SimpleLaunchOperationsCenter /> },
    { id: "insights", label: t("الرؤى", "Insights"), content: <DashboardView kind="ai" /> },
    { id: "governance", label: t("المراجعة", "Review"), content: <SupremacyCommandCenter /> }
  ]} />;
  if (sectionId === "analytics") return <ControlTowerIntelligenceWorkspace />;
  if (sectionId === "operations") return <SectionTabs label={t("أدوات التشغيل", "Operations tools")} tabs={[
    { id: "status", label: t("الحالة", "Status"), content: <DashboardView kind="operations" /> },
    { id: "whatsapp", label: t("واتساب", "WhatsApp"), content: <WhatsAppCommandCenter /> },
    { id: "health", label: t("صحة النظام", "System health"), content: <OperationalGovernanceCenter /> }
  ]} />;
  return <SectionTabs label={t("أدوات الإعدادات", "Settings tools")} tabs={[
    { id: "configuration", label: t("الإعدادات", "Configuration"), content: <RuntimeConfigActionPanel /> },
    { id: "health", label: t("الصحة والتدقيق", "Health & audit"), content: <OperationalGovernanceCenter /> }
  ]} />;
}

export function ControlTowerView({ sectionId }: { sectionId?: string }) {
  const { tr } = useControlTowerLocale();
  const section = findControlTowerSection(sectionId);
  const isOverview = section.id === "overview";

  return <div className="space-y-6">
    <header className="flex items-start gap-3 sm:gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--border-gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"><SaloraIcon name={section.icon} className="h-5 w-5" /></span>
      <div className="min-w-0"><p className="text-xs font-semibold text-[var(--gold-soft)]">SALORA</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{isOverview ? tr("Today at SALORA") : tr(section.label)}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{tr(section.description)}</p></div>
    </header>
    <DomainWorkspace sectionId={section.id} />
  </div>;
}
