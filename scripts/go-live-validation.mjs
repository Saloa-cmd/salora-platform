import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const artifacts = {
  schema: read("prisma/schema.prisma"),
  packageJson: read("package.json"),
  env: read(".env.example"),
  webhooks: read("apps/web/app/api/channels/whatsapp/webhook/route.ts"),
  aiGateway: read("packages/backend/src/ai/gateway/gateway.ts"),
  whatsappSecurity: read("packages/backend/src/channels/whatsapp/security.ts"),
  goLiveReview: read("docs/go-live-readiness-review.md"),
  openaiPlaybook: read("docs/openai-activation-playbook.md"),
  geminiPlaybook: read("docs/gemini-activation-playbook.md"),
  whatsappPlaybook: read("docs/whatsapp-activation-playbook.md"),
  stagingSuite: read("docs/staging-validation-suite.md"),
  stagingReport: read("docs/staging-validation-report.md"),
  launchChecklist: read("docs/production-launch-checklist.md"),
  dashboard: read("docs/executive-launch-dashboard.md"),
  incidents: read("docs/incident-response-runbooks.md")
};

for (const model of ["Conversation", "ConversationMessage", "ProviderMessage", "AiEvaluationRecord"]) {
  assert.ok(artifacts.schema.includes(`model ${model}`), `go-live requires ${model} persistence`);
}

for (const key of ["OPENAI_API_KEY=", "GEMINI_API_KEY=", "WHATSAPP_ENABLED=false", "WHATSAPP_APP_SECRET=", "SENTRY_DSN=", "OTEL_EXPORTER_OTLP_ENDPOINT="]) {
  assert.ok(artifacts.env.includes(key), `env template should include ${key}`);
}

assert.ok(artifacts.webhooks.includes("verifyWhatsAppChallenge"), "WhatsApp webhook must support challenge verification");
assert.ok(artifacts.webhooks.includes("verifyWhatsAppSignature"), "WhatsApp webhook must validate signatures");
assert.ok(artifacts.aiGateway.includes("AI provider is not allowed in this environment") || artifacts.aiGateway.includes("environmentAllowsProvider"), "AI Gateway must enforce provider environment governance");

for (const doc of ["goLiveReview", "openaiPlaybook", "geminiPlaybook", "whatsappPlaybook"]) {
  assert.ok(artifacts[doc].includes("Rollback") || artifacts[doc].includes("rollback"), `${doc} should include rollback guidance`);
  assert.ok(artifacts[doc].includes("Monitoring") || artifacts[doc].includes("monitoring"), `${doc} should include monitoring guidance`);
}

for (const domain of ["auth", "orders", "loyalty", "recommendations", "AI Gateway", "WhatsApp"]) {
  assert.ok(artifacts.stagingSuite.toLowerCase().includes(domain.toLowerCase()) || artifacts.stagingReport.toLowerCase().includes(domain.toLowerCase()), `staging validation should cover ${domain}`);
}

for (const launchGate of ["Secrets", "Monitoring", "Backups", "Migrations", "Rollback", "Alerts", "Dashboards"]) {
  assert.ok(artifacts.launchChecklist.includes(launchGate), `launch checklist should include ${launchGate}`);
}

for (const metric of ["AI Usage", "AI Cost", "WhatsApp Activity", "Orders", "Loyalty Activity", "Failures", "Latency"]) {
  assert.ok(artifacts.dashboard.includes(metric), `executive dashboard should track ${metric}`);
}

for (const incident of ["Provider Outage", "WhatsApp Outage", "Database Outage", "Redis Outage", "AI Degradation"]) {
  assert.ok(artifacts.incidents.includes(incident), `incident runbooks should cover ${incident}`);
}

console.log("Go-live validation passed.");
