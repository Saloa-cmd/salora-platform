"use client";

import Link from "next/link";
import { SaloraIcon } from "@/components/ui/SaloraIcon";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { CapabilityCard } from "./CapabilityCard";
import { ExperienceDesignStudio } from "./ExperienceDesignStudio";
import { MenuAuthorityStudio } from "./MenuAuthorityStudio";
import { ProductMediaManager } from "./ProductMediaManager";
import { MediaGovernanceAudit } from "./MediaGovernanceAudit";
import { ProductActionPanel, LoyaltyActionPanel, RuntimeConfigActionPanel } from "./NoCodeActionPanel";
import { SimpleLaunchOperationsCenter } from "./SimpleLaunchOperationsCenter";
import { SupremacyCommandCenter } from "./SupremacyCommandCenter";
import { WhatsAppCommandCenter } from "./WhatsAppCommandCenter";
import { OperationalGovernanceCenter } from "./OperationalGovernanceCenter";
import { findControlTowerSection } from "@/lib/control-tower/registry";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";

function Overview() {
  const { tr } = useControlTowerLocale();
  const actions = [
    { href: "/control-tower/experience", icon: "pages" as const, title: "Edit homepage draft", detail: "Open the typed ExperiencePageV2 studio." },
    { href: "/control-tower/menu", icon: "menu" as const, title: "Review menu authority", detail: "Inspect source, revisions and presentation boundaries." },
    { href: "/control-tower/orders", icon: "orders" as const, title: "Open order operations", detail: "Use existing validated order workflows." },
    { href: "/control-tower/operations", icon: "whatsapp" as const, title: "Review operational status", detail: "WhatsApp and runtime governance without secret exposure." }
  ];
  return <div className="grid gap-6">
    <DashboardGrid columns="two">
      <DashboardCard title={tr("Priority work")} eyebrow={tr("Action center")}>
        <div className="grid gap-2">{actions.map((action) => <Link key={action.href} href={action.href} className="flex min-h-16 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 transition hover:border-[var(--border-gold)]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gold)]/10 text-[var(--gold-soft)]"><SaloraIcon name={action.icon} className="h-5 w-5" /></span><span><strong className="block text-sm text-[var(--cream)]">{tr(action.title)}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{tr(action.detail)}</span></span></Link>)}</div>
      </DashboardCard>
      <DashboardCard title={tr("Experience governance")} eyebrow={tr("Verified boundary")}>
        <div className="grid gap-3 text-sm"><div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4"><strong className="text-amber-200">{tr("Menu Authority remains explicit")}</strong><p className="mt-2 leading-6 text-[var(--muted)]">{tr("The operator interface does not describe legacy-catalog as a governed published authority.")}</p></div><div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4"><strong className="text-emerald-200">{tr("PR3 experience changes are draft-only")}</strong><p className="mt-2 leading-6 text-[var(--muted)]">{tr("Review, approval, publish, scheduling and rollback are deferred to P25 PR4.")}</p></div></div>
      </DashboardCard>
    </DashboardGrid>
    <DashboardCard title={tr("Operational surfaces")} eyebrow={tr("No invented business metrics")}><p className="text-sm leading-6 text-[var(--muted)]">{tr("Revenue, orders, customers and campaign values are shown only inside the existing data-backed dashboards. This overview is intentionally an action workspace rather than a placeholder KPI grid.")}</p></DashboardCard>
  </div>;
}

function DomainWorkspace({ sectionId }: { sectionId: ControlTowerSectionId }) {
  if (sectionId === "overview") return <Overview />;
  if (sectionId === "experience") return <ExperienceDesignStudio />;
  if (sectionId === "menu") return <><MenuAuthorityStudio /><div className="mt-6 grid gap-6"><ProductActionPanel /><MediaGovernanceAudit /><ProductMediaManager /></div></>;
  if (sectionId === "orders") return <SupremacyCommandCenter />;
  if (sectionId === "customers") return <><DashboardGrid columns="two"><DashboardCard title="Customer workspace" eyebrow="Existing intelligence"><p className="text-sm leading-6 text-[var(--muted)]">Customer details remain permission-scoped in the existing intelligence dashboard. PR3 does not widen PII access.</p><Link href="/dashboard/customers" className="premium-button premium-button-ghost mt-4">Open customer intelligence</Link></DashboardCard><LoyaltyActionPanel /></DashboardGrid></>;
  if (sectionId === "marketing") return <SimpleLaunchOperationsCenter />;
  if (sectionId === "ai") return <><SimpleLaunchOperationsCenter /><div className="mt-6"><SupremacyCommandCenter /></div></>;
  if (sectionId === "analytics") return <DashboardGrid columns="two">{[{ label: "Revenue", href: "/dashboard/revenue" }, { label: "Customers", href: "/dashboard/customers" }, { label: "Operations", href: "/dashboard/operations" }, { label: "AI", href: "/dashboard/ai" }].map(({ label, href }) => <Link key={href} href={href} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-[var(--border-gold)]"><span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Existing dashboard</span><strong className="mt-2 block text-lg">{label}</strong></Link>)}</DashboardGrid>;
  if (sectionId === "operations") return <><WhatsAppCommandCenter /><div className="mt-6"><OperationalGovernanceCenter /></div></>;
  return <><DashboardGrid columns="two"><RuntimeConfigActionPanel /><DashboardCard title="Governed settings" eyebrow="Server controlled"><p className="text-sm leading-6 text-[var(--muted)]">Configuration writes remain typed, non-secret, permission checked and audited. No arbitrary table or SQL surface exists.</p></DashboardCard></DashboardGrid><div className="mt-6"><OperationalGovernanceCenter /></div></>;
}

export function ControlTowerView({ sectionId }: { sectionId?: string }) {
  const { tr } = useControlTowerLocale();
  const section = findControlTowerSection(sectionId);
  return <div className="space-y-8">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--border-gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"><SaloraIcon name={section.icon} className="h-6 w-6" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold-soft)]">SALORA OPERATING SYSTEM</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{tr(section.label)}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{tr(section.description)}</p></div></div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{tr("Permission-scoped workspace")}</span>
    </header>
    <DashboardSection title={tr("What you can do here")} description={tr("Only capabilities backed by current services or explicitly bounded draft workflows are shown.")}><DashboardGrid columns="two">{section.capabilities.map((item) => <CapabilityCard key={item.title} capability={item} />)}</DashboardGrid></DashboardSection>
    <DashboardSection title={tr(section.commandLabel)} description={tr("Domain-specific actions pass through authentication, validation, authorization, application services, repositories and audit controls.")}><DomainWorkspace sectionId={section.id} /></DashboardSection>
  </div>;
}
