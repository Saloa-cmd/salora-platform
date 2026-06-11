import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const files = {
  channelProvider: read("packages/backend/src/channels/provider.ts"),
  registry: read("packages/backend/src/channels/registry.ts"),
  metrics: read("packages/backend/src/channels/metrics.ts"),
  conversationSchemas: read("packages/backend/src/domains/conversations/schemas.ts"),
  conversationService: read("packages/backend/src/domains/conversations/service.ts"),
  whatsappConfig: read("packages/backend/src/channels/whatsapp/config.ts"),
  whatsappSecurity: read("packages/backend/src/channels/whatsapp/security.ts"),
  whatsappParser: read("packages/backend/src/channels/whatsapp/parser.ts"),
  whatsappProvider: read("packages/backend/src/channels/whatsapp/provider.ts"),
  whatsappService: read("packages/backend/src/channels/whatsapp/service.ts"),
  whatsappWebhook: read("packages/backend/src/channels/whatsapp/webhook.ts"),
  route: read("apps/web/app/api/channels/whatsapp/webhook/route.ts"),
  env: read(".env.example"),
  docs: read("docs/omnichannel-analysis.md")
};

for (const method of ["sendMessage", "sendNotification", "sendTemplate", "trackDelivery"]) {
  assert.ok(files.channelProvider.includes(method), `ChannelProvider should support ${method}`);
}

for (const entity of ["Conversation", "Message", "MessageStatus", "CustomerContext"]) {
  assert.ok(files.docs.includes(entity) || files.conversationSchemas.includes(entity) || files.conversationService.includes(entity), `conversation domain should cover ${entity}`);
}

for (const key of ["WHATSAPP_ENABLED=false", "WHATSAPP_VERIFY_TOKEN=", "WHATSAPP_PHONE_NUMBER_ID=", "WHATSAPP_ACCESS_TOKEN=", "WHATSAPP_BUSINESS_ACCOUNT_ID=", "WHATSAPP_APP_SECRET="]) {
  assert.ok(files.env.includes(key), `.env.example should include ${key}`);
}

for (const securityControl of ["verifyWhatsAppChallenge", "verifyWhatsAppSignature", "sanitizeWhatsAppText"]) {
  assert.ok(files.whatsappSecurity.includes(securityControl), `WhatsApp security should include ${securityControl}`);
}

for (const integration of ["askConcierge", "recommendProductsAdvanced", "helpWithOrder", "loyaltyAssistant", "recommendPairingsAdvanced"]) {
  assert.ok(files.whatsappService.includes(integration), `WhatsApp service should integrate ${integration}`);
}

for (const metric of ["recordChannelInbound", "recordChannelOutbound", "recordChannelWebhookFailure", "recordChannelDelivery", "recordChannelLatency"]) {
  assert.ok(files.metrics.includes(metric), `channel metrics should include ${metric}`);
}

assert.ok(files.route.includes("GET"), "WhatsApp webhook route should support verification GET");
assert.ok(files.route.includes("POST"), "WhatsApp webhook route should support inbound POST");
assert.ok(files.whatsappProvider.includes("WHATSAPP_ENABLED"), "WhatsApp provider should remain disabled by default");
assert.ok(files.whatsappWebhook.includes("handleWhatsAppWebhook"), "Webhook handler should be exported");
assert.ok(files.docs.includes("WhatsApp Cloud API"), "Omnichannel analysis should mention WhatsApp Cloud API");

console.log("Omnichannel platform tests passed.");
