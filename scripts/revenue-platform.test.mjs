import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const files = {
  schema: read("prisma/schema.prisma"),
  migration: read("prisma/migrations/202605310004_revenue_platform/migration.sql"),
  paymentSchemas: read("packages/backend/src/domains/payments/schemas.ts"),
  paymentService: read("packages/backend/src/domains/payments/service.ts"),
  providerTypes: read("packages/backend/src/payments/types.ts"),
  mockProvider: read("packages/backend/src/payments/mock/provider.ts"),
  stripeProvider: read("packages/backend/src/payments/stripe/provider.ts"),
  paymentOrchestrator: read("packages/backend/src/payments/service.ts"),
  paymentSecurity: read("packages/backend/src/payments/security.ts"),
  revenueAnalytics: read("packages/backend/src/analytics/revenue/metrics.ts"),
  aiRevenueContext: read("packages/backend/src/ai/context/revenueContext.ts"),
  refundRoute: read("apps/web/app/api/payments/refund/route.ts"),
  webhookRoute: read("apps/web/app/api/payments/webhook/route.ts"),
  env: read(".env.example"),
  docs: read("docs/revenue-platform-analysis.md")
};

for (const model of ["Payment", "PaymentIntent", "Refund", "PaymentEvent", "PaymentMethodReference", "PaymentAuditLog", "PaymentReconciliationRecord"]) {
  assert.ok(files.schema.includes(`model ${model}`), `Prisma schema should include ${model}`);
}

for (const status of ["PENDING", "REQUIRES_ACTION", "AUTHORIZED", "PAID", "FAILED", "CANCELED", "REFUNDED", "PARTIALLY_REFUNDED"]) {
  assert.ok(files.paymentSchemas.includes(status), `payment status ${status} should be modeled`);
}

for (const method of ["createPaymentIntent", "confirmPayment", "cancelPayment", "createRefund", "parseWebhookEvent", "verifyWebhookSignature", "getPaymentStatus", "getRefundStatus"]) {
  assert.ok(files.providerTypes.includes(method), `PaymentProvider should include ${method}`);
}

assert.ok(files.mockProvider.includes("MockPaymentProvider"), "mock provider should exist");
assert.ok(files.mockProvider.includes("webhook simulation") || files.mockProvider.includes("parseWebhookEvent"), "mock provider should simulate webhooks");
assert.ok(files.stripeProvider.includes("Stripe provider is disabled or missing credentials"), "Stripe should be disabled without credentials");
assert.ok(files.stripeProvider.includes("verifyWebhookSignature"), "Stripe webhook signatures should be verified");
assert.ok(files.paymentSecurity.includes("PCI-sensitive card data"), "security should reject card data");
assert.ok(files.paymentOrchestrator.includes("markPaymentSucceeded"), "payments should synchronize successful orders");
assert.ok(files.paymentOrchestrator.includes("recordPaymentEvent"), "webhooks should be idempotent through payment events");
assert.ok(files.paymentService.includes("LoyaltyPointsAwarded"), "successful payments should award loyalty");
assert.ok(files.paymentService.includes("LoyaltyPointsReversed"), "refunds should reverse loyalty");
assert.ok(files.revenueAnalytics.includes("grossRevenue"), "revenue analytics should track gross revenue");
assert.ok(files.aiRevenueContext.includes("excludes"), "AI revenue context should exclude sensitive payment material");
assert.ok(files.refundRoute.includes("MANAGER") && files.refundRoute.includes("ADMIN"), "refund API should require elevated role");
assert.ok(files.webhookRoute.includes("stripe-signature"), "payment webhook should pass signature");

for (const key of ["PAYMENTS_ENABLED=false", "PAYMENT_PROVIDER=mock", "STRIPE_ENABLED=false", "STRIPE_SECRET_KEY=", "STRIPE_WEBHOOK_SECRET=", "STRIPE_API_VERSION=2025-01-27.acacia"]) {
  assert.ok(files.env.includes(key), `.env.example should include ${key}`);
}

for (const table of ["payments", "payment_intents", "refunds", "payment_events", "payment_audit_logs", "payment_reconciliation_records"]) {
  assert.ok(files.migration.includes(`\"${table}\"`), `migration should create ${table}`);
}

assert.ok(files.docs.includes("Recommended Implementation Strategy"), "revenue analysis should include implementation strategy");

console.log("Revenue platform tests passed.");
