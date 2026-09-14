import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const { MAX_ANALYTICS_BODY_BYTES, parseMenuAnalyticsEvent } = await import("../apps/web/lib/analytics/privacy.ts");

const validAnalyticsEvent = {
  eventType: "view",
  revisionId: "76d26a51-e9df-4787-b577-2655a94d7bc5",
  channel: "web",
  metadata: { locale: "ar", placement: "menu" }
};
assert.equal(parseMenuAnalyticsEvent(JSON.stringify(validAnalyticsEvent)).success, true, "A bounded analytics event must parse");
assert.equal(parseMenuAnalyticsEvent(JSON.stringify({ ...validAnalyticsEvent, requestId: "forged" })).success, false, "Clients must not supply reserved request IDs");
assert.equal(parseMenuAnalyticsEvent(JSON.stringify({ ...validAnalyticsEvent, metadata: { revisionId: "forged" } })).success, false, "Reserved trusted fields must not be accepted as client metadata");
assert.equal(parseMenuAnalyticsEvent(JSON.stringify({ ...validAnalyticsEvent, metadata: { placement: { nested: true } } })).success, false, "Nested analytics metadata must be rejected");
assert.equal(parseMenuAnalyticsEvent(JSON.stringify({ ...validAnalyticsEvent, metadata: { locale: "ar", placement: "menu", experimentKey: "exp", variant: "a", source: "qr", extra: "overflow" } })).success, false, "Analytics metadata key limits must be enforced");
assert.equal(parseMenuAnalyticsEvent("x".repeat(MAX_ANALYTICS_BODY_BYTES + 1)).success, false, "Oversized analytics events must be rejected");

const analyticsRoute = read("apps/web/app/api/analytics/menu-event/route.ts");
const menuExperience = read("apps/web/components/menu/MenuExperience.tsx");
assert.match(analyticsRoute, /if \(!saloraRuntime\.analyticsEnabled\)/, "The server analytics flag must short-circuit before persistence");
assert.match(analyticsRoute, /status: 204/, "Disabled analytics must return without accepting an event");
assert.match(analyticsRoute, /authority\.products\.some/, "Analytics product references must be checked against the current published authority");
assert.doesNotMatch(analyticsRoute, /ipAddress:/, "Analytics must not persist IP addresses by default");
assert.doesNotMatch(analyticsRoute, /userAgent:/, "Analytics must not persist user agents by default");
assert.match(analyticsRoute, /requestId, 422/, "Invalid analytics payloads must return 422");
assert.match(menuExperience, /if \(!analyticsEnabled \|\| !revision\?\.id/, "The client analytics flag must prevent beacon creation");

const whatsappSend = read("apps/web/app/api/whatsapp/send/route.ts");
assert.match(whatsappSend, /requirePermission\(request, "system:write"\)/, "WhatsApp send must require an operator permission");

for (const [path, permission] of [
  ["apps/web/app/api/customers/route.ts", "staff:read"],
  ["apps/web/app/api/inventory/route.ts", "catalog:read"],
  ["apps/web/app/api/loyalty/route.ts", "staff:read"],
  ["apps/web/app/api/notifications/route.ts", "system:read"]
]) {
  assert.match(read(path), new RegExp(`requirePermission\\(request, "${permission}"\\)`), `${path} must protect sensitive reads`);
}

const publicOrders = read("apps/web/app/api/orders/route.ts");
assert.match(publicOrders, /customerId: undefined/, "Anonymous checkout must not accept a customer object reference");
assert.match(publicOrders, /customer: undefined/, "Anonymous checkout must not return a customer profile");

const paymentWebhook = read("apps/web/app/api/payments/webhook/route.ts");
assert.match(paymentWebhook, /PAYMENT_PROVIDER !== "stripe"/, "Public payment webhooks must be bound to configured Stripe");
assert.doesNotMatch(paymentWebhook, /\? "stripe" : "mock"/, "Public input must never select the mock webhook provider");

const paymentService = read("packages/backend/src/payments/service.ts");
assert.match(paymentService, /amount: order\.total/, "Payment amount must come from the authoritative order");
assert.match(paymentService, /result\.providerPaymentIntentId !== providerPaymentId/, "Confirmation must bind the provider intent");
assert.match(paymentService, /result\.currency !== payment\.currency/, "Confirmation must bind the currency");

const stripe = read("packages/backend/src/payments/stripe/provider.ts");
assert.ok((stripe.match(/AbortSignal\.timeout\(env\.PAYMENT_INTENT_TIMEOUT_MS\)/g) ?? []).length >= 6, "Every Stripe operation must have a deadline");

for (const path of [
  "docs/PHASE_D_ADMIN_BOOTSTRAP_EXECUTION_PLAN.md",
  "docs/CHECKPOINT_PHASES_A_TO_D_COMPLETE.md",
  "docs/COMPLETION_SUMMARY_PHASES_A_TO_D.md",
  "docs/ADMIN_CONTROL_TOWER_ACCESS_PHASES_A_TO_D_REPORT.md"
]) assert.doesNotMatch(read(path), /SaloraCtrlTower2026/, `${path} must not contain the exposed bootstrap password`);

console.log("P26 security hardening regression contract: PASS");
