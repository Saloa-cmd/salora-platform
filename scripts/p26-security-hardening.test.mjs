import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

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
