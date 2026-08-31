"use client";

import { SaloraIcon } from "@/components/ui/SaloraIcon";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
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
function DomainWorkspace({ sectionId }: { sectionId: ControlTowerSectionId }) {
  if (sectionId === "overview") return <ControlTowerHome />;
  if (sectionId === "experience") return <ExperienceDesignStudio />;
  if (sectionId === "menu") return <CatalogWorkspace />;
  if (sectionId === "orders") return <div className="space-y-6"><DashboardView kind="operations" /><SupremacyCommandCenter /></div>;
  if (sectionId === "customers") return <div className="space-y-6"><DashboardView kind="customers" /><LoyaltyActionPanel /></div>;
  if (sectionId === "marketing") return <MarketingOperationsWorkspace />;
  if (sectionId === "ai") return <div className="space-y-6"><DashboardView kind="ai" /><SimpleLaunchOperationsCenter /><SupremacyCommandCenter /></div>;
  if (sectionId === "analytics") return <ControlTowerIntelligenceWorkspace />;
  if (sectionId === "operations") return <div className="space-y-6"><DashboardView kind="operations" /><WhatsAppCommandCenter /><OperationalGovernanceCenter /></div>;
  return <><DashboardGrid columns="two"><RuntimeConfigActionPanel /><DashboardCard title="Governed settings" eyebrow="Server controlled"><p className="text-sm leading-6 text-[var(--muted)]">Configuration writes remain typed, non-secret, permission checked and audited. No arbitrary table or SQL surface exists.</p></DashboardCard></DashboardGrid><div className="mt-6"><OperationalGovernanceCenter /></div></>;
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
