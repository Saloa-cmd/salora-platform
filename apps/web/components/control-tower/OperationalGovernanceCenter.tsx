import { AlertCard } from "@/components/dashboard/AlertCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { RuntimeStatusCard } from "@/components/dashboard/RuntimeStatusCard";
import type { DashboardAlert, DashboardMetric, RuntimeStatus } from "@/lib/dashboard/types";

type ActivationProvider = {
  name: string;
  status: "Blocked" | "Pending" | "Ready";
  health: string;
  credentials: "Missing" | "Configured" | "Not exposed";
  readiness: string;
  risk: "Low" | "Medium" | "High";
};

const providers: ActivationProvider[] = [
  { name: "PostgreSQL", status: "Ready", health: "Supabase staging migrations and table certification passed", credentials: "Configured", readiness: "Runtime operations ready; backup restore live drill remains required", risk: "Medium" },
  { name: "Redis", status: "Ready", health: "Upstash Redis and BullMQ runtime certification passed", credentials: "Configured", readiness: "Runtime jobs ready; continue observing queue pressure during staging load tests", risk: "Medium" },
  { name: "OpenAI", status: "Ready", health: "Direct API and live app route certification passed", credentials: "Configured", readiness: "Certified for controlled activation; keep approval gate and rollback to mock", risk: "Medium" },
  { name: "Gemini", status: "Pending", health: "Credential configured; connectivity returned provider not found", credentials: "Configured", readiness: "Verify Gemini API key shape/project access, then rerun connectivity, fallback, benchmark, and evaluation", risk: "High" },
  { name: "WhatsApp", status: "Blocked", health: "Webhook architecture present", credentials: "Missing", readiness: "Requires Meta staging verification and signature drill", risk: "High" },
  { name: "Stripe", status: "Ready", health: "Stripe test-mode payment intent, refund, and webhook signature certification passed", credentials: "Configured", readiness: "Revenue runtime certified for controlled test-mode activation; production remains approval-gated", risk: "Medium" }
];

const stagingStatuses: RuntimeStatus[] = providers.map((provider) => ({
  label: provider.name,
  status: provider.status === "Ready" ? "ok" : provider.status === "Pending" ? "warning" : "critical",
  detail: `${provider.status}: ${provider.readiness}`
}));

const runbooks: RuntimeStatus[] = [
  { label: "Incident procedures", status: "warning", detail: "Documented; needs live drill evidence." },
  { label: "Rollback procedures", status: "warning", detail: "Documented; deployment and config rollback drills pending." },
  { label: "Provider failures", status: "warning", detail: "Procedures documented for AI, Stripe, WhatsApp, Redis, PostgreSQL." },
  { label: "Recovery procedures", status: "warning", detail: "Backup/restore validation pending staging infrastructure." },
  { label: "Business continuity actions", status: "warning", detail: "Designed; final launch sign-off pending." }
];

const governanceActions: RuntimeStatus[] = [
  { label: "Provider activation", status: "warning", detail: "Requires approval before OpenAI, Gemini, WhatsApp, or Stripe activation." },
  { label: "Provider suspension", status: "warning", detail: "Must be encoded as runtime config and audited." },
  { label: "Provider blacklisting", status: "warning", detail: "Requires persistent provider policy and incident link." },
  { label: "Provider fallback", status: "warning", detail: "Fallback exists architecturally; live provider drill pending." }
];

const continuity: RuntimeStatus[] = [
  { label: "Backup status", status: "warning", detail: "Supabase backup procedure documented; live drill evidence pending." },
  { label: "Restore validation", status: "empty", detail: "Restore drill pending." },
  { label: "Migration history", status: "ok", detail: "Five Prisma migrations applied to Supabase staging." },
  { label: "Deployment history", status: "warning", detail: "Build passes; rollback drill pending." },
  { label: "Provider incidents", status: "empty", detail: "No live provider incidents because providers are not activated." }
];

const certificationMetrics: DashboardMetric[] = [
  { label: "Operational readiness", value: "9.1/10", detail: "Software ready; staging drills pending", status: "warning" },
  { label: "Activation readiness", value: "8.8/10", detail: "Blocked by missing external credentials", status: "warning" },
  { label: "Provider readiness", value: "8.6/10", detail: "Architecture ready; live validation pending", status: "warning" },
  { label: "Business continuity", value: "8.7/10", detail: "Runbooks ready; restore/rollback drills pending", status: "warning" }
];

const infrastructureCertification: RuntimeStatus[] = [
  { label: "Environment certification", status: "warning", detail: "Environment contract exists; staging secrets are pending." },
  { label: "Infrastructure certification", status: "warning", detail: "PostgreSQL and Redis endpoints are required before activation." },
  { label: "Provider certification", status: "warning", detail: "OpenAI and Stripe are certified for controlled activation; Gemini completion, WhatsApp, Sentry, and OTEL remain blocked or partial." },
  { label: "Activation status", status: "warning", detail: "Software ready; controlled go-live blocked until staging drills pass." }
];

const goLiveReadiness: RuntimeStatus[] = [
  { label: "Database Ready", status: "ok", detail: "Supabase staging migrations, Prisma generation, table certification, and safe seed passed." },
  { label: "Redis Ready", status: "ok", detail: "Upstash smoke, queue processing, retry, DLQ, worker recovery, and metrics validation passed." },
  { label: "AI Ready", status: "ok", detail: "OpenAI direct API and live app AI routes certified; global activation remains approval-gated." },
  { label: "WhatsApp Ready", status: "critical", detail: "Blocked until Meta staging webhook and signature validation pass." },
  { label: "Stripe Ready", status: "ok", detail: "Stripe test mode payment intent, refund, webhook signature, idempotency, and revenue synchronization readiness passed." },
  { label: "Monitoring Ready", status: "warning", detail: "Sentry staging event certification passed; OTel staging export validation pending." },
  { label: "Rollback Ready", status: "warning", detail: "Procedures exist; live rollback drill pending." }
];

const approvalAlerts: DashboardAlert[] = [
  { id: "openai-approval", title: "OpenAI activation approval required", detail: "Do not enable live OpenAI traffic without executive approval, cost limit, fallback, and evaluation monitoring.", severity: "warning" },
  { id: "gemini-approval", title: "Gemini activation approval required", detail: "Require routing and fallback certification before staging traffic.", severity: "warning" },
  { id: "whatsapp-approval", title: "WhatsApp activation approval required", detail: "Meta webhook verification, signature validation, and compliance review must pass first.", severity: "critical" },
  { id: "stripe-approval", title: "Stripe production approval required", detail: "Test-mode certification passed; production activation still requires executive approval, production keys, and live webhook endpoint verification.", severity: "warning" }
];

const providerCertification: RuntimeStatus[] = [
  { label: "PostgreSQL", status: "ok", detail: "ACTIVE - Supabase migration and table certification passed. Score 9.8/10." },
  { label: "Redis", status: "ok", detail: "ACTIVE - Upstash smoke, BullMQ, retry, DLQ, and worker recovery passed. Score 9.9/10." },
  { label: "OpenAI", status: "ok", detail: "CERTIFIED - key, model listing, completion, live AI routes, evaluation, usage, and metrics passed." },
  { label: "Gemini", status: "warning", detail: "PARTIAL - key and model listing passed; configured completion endpoint returned NOT_FOUND." },
  { label: "Stripe", status: "ok", detail: "CERTIFIED - test key, payment intent, refund, webhook signature, idempotency, and sync readiness passed. Score 9.6/10." },
  { label: "WhatsApp", status: "critical", detail: "BLOCKED - Meta app, token, phone number, verify token, and app secret are missing." },
  { label: "Sentry", status: "ok", detail: "CERTIFIED - DSN, staging environment, release, event capture, stack trace, and redaction validation passed. Score 9.2/10." },
  { label: "OTEL", status: "warning", detail: "PARTIAL - local defaults exist; staging exporter endpoints not validated." }
];

function RiskBadge({ risk }: { risk: ActivationProvider["risk"] }) {
  const tone = risk === "Low" ? "text-emerald-100 border-emerald-300/25 bg-emerald-300/10" : risk === "Medium" ? "text-[var(--gold-soft)] border-[var(--border-gold)] bg-[var(--gold)]/10" : "text-red-100 border-red-300/25 bg-red-300/10";
  return <span className={`rounded-full border px-2 py-1 text-[0.68rem] font-semibold uppercase ${tone}`}>{risk}</span>;
}

export function OperationalGovernanceCenter() {
  return (
    <div className="space-y-6">
      <DashboardCard title="Runtime Activation Center" eyebrow="No secrets exposed">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-[var(--gold-soft)]">
              <tr>
                <th className="pb-3">Provider</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Health</th>
                <th className="pb-3">Credentials</th>
                <th className="pb-3">Readiness</th>
                <th className="pb-3">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-[var(--muted)]">
              {providers.map((provider) => (
                <tr key={provider.name}>
                  <td className="py-3 font-semibold text-[var(--cream)]">{provider.name}</td>
                  <td className="py-3">{provider.status}</td>
                  <td className="py-3">{provider.health}</td>
                  <td className="py-3">{provider.credentials}</td>
                  <td className="py-3">{provider.readiness}</td>
                  <td className="py-3"><RiskBadge risk={provider.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <DashboardGrid columns="two">
        <RuntimeStatusCard title="Staging Readiness Center" statuses={stagingStatuses} />
        <RuntimeStatusCard title="Infrastructure Certification" statuses={infrastructureCertification} />
        <RuntimeStatusCard title="Go-Live Readiness" statuses={goLiveReadiness} />
        <RuntimeStatusCard title="Operational Runbook Center" statuses={runbooks} />
        <AlertCard title="Executive Approval System" alerts={approvalAlerts} />
        <RuntimeStatusCard title="Live Provider Governance" statuses={governanceActions} />
        <RuntimeStatusCard title="Provider Certification Center" statuses={providerCertification} />
        <RuntimeStatusCard title="Business Continuity Center" statuses={continuity} />
        <DashboardCard title="Operational Certification" eyebrow="Readiness scores">
          <div className="grid gap-3 sm:grid-cols-2">
            {certificationMetrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm text-[var(--muted)]">{metric.label}</p>
                <p className="mt-2 text-xl font-semibold text-[var(--cream)]">{metric.value}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{metric.detail}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </DashboardGrid>
    </div>
  );
}
