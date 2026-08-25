"use client";

import { SaloraIcon } from "@/components/ui/SaloraIcon";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { CapabilityCard } from "./CapabilityCard";
import { ExperienceDesignStudio } from "./ExperienceDesignStudio";
import { MenuAuthorityStudio } from "./MenuAuthorityStudio";
import { ProductMediaManager } from "./ProductMediaManager";
import { ProductReadinessWorkspace } from "./ProductReadinessWorkspace";
import { MediaGovernanceAudit } from "./MediaGovernanceAudit";
import { ProductActionPanel, LoyaltyActionPanel, RuntimeConfigActionPanel } from "./NoCodeActionPanel";
import { MarketingOperationsWorkspace } from "./MarketingOperationsWorkspace";
import { SimpleLaunchOperationsCenter } from "./SimpleLaunchOperationsCenter";
import { SupremacyCommandCenter } from "./SupremacyCommandCenter";
import { WhatsAppCommandCenter } from "./WhatsAppCommandCenter";
import { OperationalGovernanceCenter } from "./OperationalGovernanceCenter";
import { ControlTowerOverview } from "./ControlTowerOverview";
import { ControlTowerDataPulse } from "./ControlTowerDataPulse";
import { ControlTowerCopilot } from "./ControlTowerCopilot";
import { ControlTowerIntelligenceWorkspace } from "./ControlTowerIntelligenceWorkspace";
import { findControlTowerSection } from "@/lib/control-tower/registry";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";

function Overview() {
  return <div className="space-y-6"><ControlTowerDataPulse /><ControlTowerOverview /></div>;
}

function DomainWorkspace({ sectionId }: { sectionId: ControlTowerSectionId }) {
  if (sectionId === "overview") return <Overview />;
  if (sectionId === "experience") return <ExperienceDesignStudio />;
  if (sectionId === "menu") return <><MenuAuthorityStudio /><div className="mt-6 grid gap-6"><ProductReadinessWorkspace /><ProductActionPanel /><MediaGovernanceAudit /><ProductMediaManager /></div></>;
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
  return <div className="space-y-8">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--border-gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"><SaloraIcon name={section.icon} className="h-6 w-6" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold-soft)]">SALORA · CONTROL TOWER</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{isOverview ? tr("Good morning, this is SALORA today") : tr(section.label)}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{tr(section.description)}</p></div></div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{tr("Permission-scoped workspace")}</span>
    </header>
    {!isOverview ? <DashboardSection title={tr("Workspace scope")} description={tr("Only current, permission-backed capabilities are available here.")}><DashboardGrid columns="two">{section.capabilities.map((item) => <CapabilityCard key={item.title} capability={item} />)}</DashboardGrid></DashboardSection> : null}
    {isOverview ? <DomainWorkspace sectionId={section.id} /> : <DashboardSection title={tr(section.commandLabel)} description={tr("Actions are authenticated, validated, authorized and audited by the existing services.")}><DomainWorkspace sectionId={section.id} /></DashboardSection>}
    <ControlTowerCopilot key={section.id} sectionId={section.id} />
  </div>;
}
