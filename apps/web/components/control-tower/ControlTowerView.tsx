"use client";

import Link from "next/link";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { CapabilityCard } from "./CapabilityCard";
import { InventoryActionPanel, LoyaltyActionPanel, NotificationActionPanel, ProductActionPanel, RuntimeConfigActionPanel } from "./NoCodeActionPanel";
import { OperationalGovernanceCenter } from "./OperationalGovernanceCenter";
import { SimpleLaunchOperationsCenter } from "./SimpleLaunchOperationsCenter";
import { SupremacyCommandCenter } from "./SupremacyCommandCenter";
import { WhatsAppCommandCenter } from "./WhatsAppCommandCenter";
import { findControlTowerSection } from "@/lib/control-tower/registry";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";
import { ExperienceDesignStudio } from "./ExperienceDesignStudio";
import { ContentOperationsStudio } from "./ContentOperationsStudio";
import { ProductMediaManager } from "./ProductMediaManager";
import { MediaGovernanceAudit } from "./MediaGovernanceAudit";

const cmsLifecycle = ["Draft", "Publish", "Schedule", "Archive"];
const appConfigAreas = ["Theme", "Colors", "Typography", "Feature flags", "Navigation", "Homepage layout", "AI features", "WhatsApp features"];
const aiControls = ["Providers", "Models", "Routing rules", "Fallback rules", "Cost limits", "Safety policies", "Prompt templates", "Recommendation rules"];
const whatsappControls = ["Templates", "Flows", "Auto replies", "AI concierge", "Order assistance", "Loyalty assistance", "Broadcast campaigns"];
const automationRecipes = ["Order Paid -> Loyalty Award", "Customer Inactive -> Offer Campaign", "Payment Failed -> WhatsApp Reminder"];
const integrations = ["OpenAI", "Gemini", "Claude", "Stripe", "WhatsApp", "Firebase", "Google Analytics", "Meta", "Future Systems"];
const governance = ["RBAC", "Permission matrix", "Audit trail", "Approval workflows", "Secrets management", "Change history", "Rollback"];

function PillList({ items }: { items: string[] }) {
  const { tr } = useControlTowerLocale();
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--muted)]">{tr(item)}</span>
      ))}
    </div>
  );
}

function BackendActivationCard({ title, items }: { title: string; items: string[] }) {
  const { tr } = useControlTowerLocale();
  return (
    <DashboardCard title={tr(title)} eyebrow={tr("No-code workspace")}>
      <p className="mb-4 text-sm leading-6 text-[var(--muted)]">{tr("This workspace is modeled in the Control Tower and ready for persistent backend activation. It is intentionally not marked live until the domain API, audit trail, and rollback contract exist.")}</p>
      <PillList items={items} />
    </DashboardCard>
  );
}

function LiveActionForSection({ sectionId }: { sectionId: ControlTowerSectionId }) {
  if (sectionId === "content") return <ProductActionPanel />;
  if (sectionId === "inventory") return <InventoryActionPanel />;
  if (sectionId === "loyalty") return <LoyaltyActionPanel />;
  if (sectionId === "notifications") return <NotificationActionPanel />;
  return null;
}

function SectionSpecificWorkspace({ sectionId }: { sectionId: ControlTowerSectionId }) {
  if (sectionId === "executive") {
    return (
      <>
        <DashboardGrid columns="two">
          <DashboardCard title="Command Links" eyebrow="Executive">
            <div className="grid gap-3 sm:grid-cols-2">
              {["/menu", "/dashboard", "/dashboard/revenue", "/dashboard/operations", "/dashboard/ai", "/dashboard/customers", "/dashboard/whatsapp"].map((href) => (
                <Link key={href} href={href} className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm font-semibold text-[var(--cream)] hover:border-[var(--border-gold)]">{href}</Link>
              ))}
            </div>
          </DashboardCard>
          <AlertCard title="Control gaps" alerts={[
            { id: "approval", title: "Approval inbox pending", detail: "Risky changes need persistent approval workflow before live editing.", severity: "warning" },
            { id: "rollback", title: "Rollback pending", detail: "CMS, AI, automation, and integration changes require version rollback contracts.", severity: "warning" }
          ]} />
        </DashboardGrid>
        <SimpleLaunchOperationsCenter />
        <SupremacyCommandCenter />
      </>
    );
  }

  if (sectionId === "content") {
    return (
      <>
        <ContentOperationsStudio />
        <ExperienceDesignStudio />
        <MediaGovernanceAudit />
        <ProductMediaManager />
        <DashboardGrid columns="two">
          <div id="product-operations-manager" className="scroll-mt-24">
            <ProductActionPanel />
          </div>
          <BackendActivationCard title="Headless CMS Lifecycle" items={[...cmsLifecycle, "Pages", "Sections", "Banners", "Promotions", "Menus", "Categories", "Landing pages"]} />
        </DashboardGrid>
        <SimpleLaunchOperationsCenter />
        <SupremacyCommandCenter />
      </>
    );
  }

  if (sectionId === "inventory") return <InventoryActionPanel />;
  if (sectionId === "loyalty") return <LoyaltyActionPanel />;
  if (sectionId === "notifications") return <NotificationActionPanel />;

  if (sectionId === "ai") return <><SimpleLaunchOperationsCenter /><SupremacyCommandCenter /></>;
  if (sectionId === "whatsapp") return <><WhatsAppCommandCenter /><BackendActivationCard title="WhatsApp Operations Center" items={whatsappControls} /><SupremacyCommandCenter /></>;
  if (sectionId === "instagram") return <SupremacyCommandCenter />;
  if (sectionId === "automation") return <BackendActivationCard title="Visual Automation Builder" items={[...automationRecipes, "Triggers", "Conditions", "Actions", "Dry run", "Retry", "Audit"]} />;
  if (sectionId === "integrations") return <BackendActivationCard title="Universal Integration Hub" items={[...integrations, "Connector registry", "Credential vault", "Health monitor"]} />;
  if (sectionId === "settings") {
    return (
      <>
        <DashboardGrid columns="two">
          <RuntimeConfigActionPanel />
          <BackendActivationCard title="Settings and Governance" items={[...appConfigAreas, ...governance, "Tenant switcher", "Future brands"]} />
        </DashboardGrid>
        <SimpleLaunchOperationsCenter />
        <SupremacyCommandCenter />
        <OperationalGovernanceCenter />
      </>
    );
  }
  if (sectionId === "revenue") return <><SimpleLaunchOperationsCenter /><SupremacyCommandCenter /></>;
  if (sectionId === "orders") return <SupremacyCommandCenter />;
  if (sectionId === "customers") return <BackendActivationCard title="Customer Management" items={["Segments", "Preferences", "Retention campaigns", "Churn risk", "Recommendation acceptance", "Value tiers"]} />;

  return <LiveActionForSection sectionId={sectionId} />;
}

export function ControlTowerView({ sectionId }: { sectionId?: string }) {
  const { tr } = useControlTowerLocale();
  const section = findControlTowerSection(sectionId);
  const Icon = section.icon;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-[var(--border-gold)] bg-[linear-gradient(135deg,rgba(201,164,92,0.12),rgba(255,255,255,0.025))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="rounded-xl border border-[var(--border-gold)] bg-black/20 p-3 text-[var(--gold-soft)]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold-soft)]">{tr("Control Tower Section")}</p>
              <h2 className="mt-1 text-2xl font-semibold leading-tight text-[var(--cream)] sm:text-3xl">{tr(section.label)}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">{tr(section.description)}</p>
            </div>
          </div>
        </div>
      </section>

      <DashboardSection title={tr("Capabilities")} description={tr("Live capabilities use existing SALORA APIs. Pending capabilities are modeled without claiming production readiness.")}>
        <DashboardGrid columns="two">
          {section.capabilities.map((capability) => <CapabilityCard key={capability.title} capability={capability} />)}
        </DashboardGrid>
      </DashboardSection>

      <div id="no-code-workspace" className="scroll-mt-24">
        <DashboardSection title={tr("No-Code Workspace")} description={tr("Operator-first controls for the selected business capability. Live write actions remain protected by existing RBAC permissions.")}>
          <SectionSpecificWorkspace sectionId={section.id} />
        </DashboardSection>
      </div>
    </div>
  );
}
