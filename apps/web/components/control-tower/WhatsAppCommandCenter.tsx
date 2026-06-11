import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";

const commandCapabilities = [
  ["Live Conversations", "Backed by channel-agnostic Conversation records"],
  ["Message History", "Backed by ConversationMessage and provider IDs"],
  ["Delivery Status", "Sent, delivered, read, and failed statuses update from Meta webhooks"],
  ["Read Status", "Read receipts are processed from Meta status webhooks"],
  ["AI Responses", "AI Concierge responses are stored with correlation IDs"],
  ["Runtime Health", "Provider readiness and webhook ledger status are exposed through Control Tower"],
  ["Conversation Search", "Uses phone, customer, provider message ID, and created-at indexes"],
  ["Customer Lookup", "Links WhatsApp phone numbers to CustomerProfile when available"],
  ["Escalate To Human", "Governed by runtime metadata and operator workflow"],
  ["Pause AI / Resume AI", "Controlled by non-secret WhatsApp runtime configuration"]
];

export function WhatsAppCommandCenter() {
  return (
    <DashboardGrid columns="two">
      <DashboardCard title="WhatsApp Command Center" eyebrow="Control Tower">
        <div className="grid gap-3">
          {commandCapabilities.map(([label, detail]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-sm font-semibold text-[var(--cream)]">{label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
            </div>
          ))}
        </div>
      </DashboardCard>
      <DashboardCard title="Operational Contract" eyebrow="Enterprise WhatsApp">
        <div className="space-y-3 text-sm leading-6 text-[var(--muted)]">
          <p>Canonical API: `/api/whatsapp/send` and `/api/whatsapp/webhook`.</p>
          <p>Storage: conversations reuse SALORA Conversation models; webhook events use a dedicated dead-letter capable ledger.</p>
          <p>Governance: sends and webhook mutations produce ActivityLog and AuditLog entries when database runtime is available.</p>
          <p>Future channels: Instagram DM, Messenger, Claude, Gemini, and n8n can reuse the provider abstraction.</p>
        </div>
      </DashboardCard>
    </DashboardGrid>
  );
}
