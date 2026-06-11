import {
  Bell,
  Bot,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CreditCard,
  FileStack,
  Gauge,
  Gift,
  Instagram,
  MessageCircle,
  Package,
  Settings,
  Workflow
} from "lucide-react";
import type { ControlTowerSection, ControlTowerSectionId } from "./types";

export const controlTowerSections: ControlTowerSection[] = [
  {
    id: "executive",
    label: "Executive",
    icon: Gauge,
    description: "Single source of truth for operating health, decisions, risk, and executive visibility.",
    capabilities: [
      { title: "Executive command view", description: "Links to Phase 9 executive dashboards.", status: "live", owner: "Executive Intelligence" },
      { title: "Approval inbox", description: "Central queue for pricing, campaign, AI, and broadcast approvals.", status: "needs-backend", owner: "Governance" }
    ]
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: CreditCard,
    description: "Pricing, payment health, revenue intelligence, refunds, campaigns, and offers.",
    capabilities: [
      { title: "Revenue intelligence", description: "Gross, net, AOV, refunds, failed payments, and channel revenue.", status: "live", owner: "Revenue Platform" },
      { title: "Simple launch offers", description: "Promotions and coupons are connected to Supabase commercial data.", status: "live", owner: "CMS + Revenue" }
    ]
  },
  {
    id: "orders",
    label: "Orders",
    icon: Package,
    description: "Order lifecycle, queue visibility, assistance, and exception workflows.",
    capabilities: [
      { title: "COD order queue", description: "Control Tower order queue uses Supabase cafe orders and launch-safe status transitions.", status: "live", owner: "Operations" },
      { title: "Stripe payment mode", description: "Stripe remains Phase 2 and is governed by runtime configuration.", status: "configured", owner: "Revenue Platform" }
    ]
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
    description: "Ingredients, stock movement, reorder risk, and product availability control.",
    capabilities: [
      { title: "Inventory movement", description: "Record stock changes through an RBAC-protected API.", status: "live", owner: "Catalog" },
      { title: "Availability rules", description: "No-code product availability and stockout handling.", status: "needs-backend", owner: "Catalog" }
    ]
  },
  {
    id: "customers",
    label: "Customers",
    icon: ChartNoAxesCombined,
    description: "Customer health, segments, preferences, retention, and lifecycle actions.",
    capabilities: [
      { title: "Customer intelligence", description: "Health, churn risk, repeat readiness, and value signals.", status: "live", owner: "Customer Intelligence" },
      { title: "Lifecycle campaigns", description: "Segment-based no-code campaigns.", status: "needs-backend", owner: "Marketing" }
    ]
  },
  {
    id: "loyalty",
    label: "Loyalty",
    icon: Gift,
    description: "Points, rewards, tiers, eligibility, and loyalty automations.",
    capabilities: [
      { title: "Award loyalty points", description: "Existing RBAC-protected loyalty entry API.", status: "live", owner: "Loyalty" },
      { title: "Rule builder", description: "No-code earn/burn/tier rules with versioning.", status: "needs-backend", owner: "Loyalty" }
    ]
  },
  {
    id: "ai",
    label: "AI",
    icon: Bot,
    description: "Providers, models, routing, fallback, safety, prompts, recommendations, and cost limits.",
    capabilities: [
      { title: "AI intelligence", description: "Provider usage, evaluation, safety, and cost signals.", status: "live", owner: "AI Platform" },
      { title: "AI product drafts", description: "Description, pairing, upsell, category, and image-prompt drafts are review-only.", status: "live", owner: "AI Governance" }
    ]
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    description: "Templates, flows, auto replies, concierge, order assistance, loyalty assistance, and broadcasts.",
    capabilities: [
      { title: "Webhook platform", description: "Existing WhatsApp webhook and provider architecture.", status: "configured", owner: "Omnichannel" },
      { title: "Command drafts", description: "WhatsApp order and promotion drafts are Control Tower governed and blocked until Meta credentials validate.", status: "configured", owner: "Omnichannel" }
    ]
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    description: "Draft captions, post ideas, schedules, approval status, and Meta publishing readiness for @salora.cafe.",
    capabilities: [
      { title: "Content drafts", description: "Instagram drafts are review-only and never auto-published.", status: "configured", owner: "Marketing" },
      { title: "Meta Graph readiness", description: "Publishing remains blocked until Meta credentials and human approval are present.", status: "restricted", owner: "Platform" }
    ]
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Email, SMS, push, in-app messages, templates, and delivery queues.",
    capabilities: [
      { title: "Queue notification", description: "Existing RBAC-protected notification queue API.", status: "live", owner: "Messaging" },
      { title: "Template lifecycle", description: "Draft, schedule, publish, archive notification templates.", status: "needs-backend", owner: "Messaging" }
    ]
  },
  {
    id: "content",
    label: "Content",
    icon: FileStack,
    description: "Headless CMS for pages, sections, banners, promotions, menus, categories, products, and landing pages.",
    capabilities: [
      { title: "Product operations", description: "Products, categories, status, price, and image URL management are connected to Supabase.", status: "live", owner: "Catalog" },
      { title: "Product media command", description: "Media drafts, approval, primary image, archive, and publish workflow are Control Tower governed.", status: "live", owner: "Catalog" },
      { title: "CMS lifecycle", description: "Advanced page and banner lifecycle remains postponed for Simple Launch.", status: "needs-backend", owner: "CMS" }
    ]
  },
  {
    id: "automation",
    label: "Automation",
    icon: Workflow,
    description: "Visual trigger, condition, and action workflows for no-code operations.",
    capabilities: [
      { title: "Recipe catalog", description: "Order Paid -> Loyalty Award, Customer Inactive -> Offer, Payment Failed -> WhatsApp.", status: "configured", owner: "Automation" },
      { title: "Execution engine", description: "Persistent automation runtime with dry-run, retry, idempotency, and audit.", status: "needs-backend", owner: "Automation" }
    ]
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Building2,
    description: "Connector registry, credential vault, health monitor, and provider activation.",
    capabilities: [
      { title: "Provider architecture", description: "OpenAI, Gemini, Claude, Stripe, WhatsApp, and mock provider modules exist.", status: "configured", owner: "Platform" },
      { title: "Credential vault UI", description: "No-code integration activation without exposing secrets.", status: "needs-backend", owner: "Security" }
    ]
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "Tenants, roles, permissions, theme, navigation, feature flags, governance, and rollout control.",
    capabilities: [
      { title: "RBAC foundation", description: "Role and permission checks exist for API writes.", status: "live", owner: "Security" },
      { title: "Runtime configuration API", description: "Configuration-as-data endpoint for pricing, AI, WhatsApp, notifications, flags, homepage, app, and recommendations.", status: "live", owner: "Platform" },
      { title: "Feature flags and governance logs", description: "Launch flags, activity logs, and audit logs are readable from Control Tower.", status: "live", owner: "Operations" },
      { title: "Runtime activation governance", description: "Readiness center for PostgreSQL, Redis, OpenAI, Gemini, WhatsApp, Stripe, runbooks, approvals, provider governance, and continuity.", status: "configured", owner: "Operations" },
      { title: "Multi-tenant config", description: "Future cafes, brands, restaurants, business switcher, and tenant-scoped settings.", status: "needs-backend", owner: "Platform" }
    ]
  }
];

export function findControlTowerSection(id?: string): ControlTowerSection {
  const fallback = controlTowerSections[0];
  if (!fallback) {
    throw new Error("Control Tower registry must include at least one section.");
  }

  return controlTowerSections.find((section) => section.id === id) ?? fallback;
}

export const validControlTowerSectionIds = controlTowerSections.map((section) => section.id) as ControlTowerSectionId[];
