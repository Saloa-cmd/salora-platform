import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const whatsappSecurity = read("packages/backend/src/channels/whatsapp/security.ts");
assert(whatsappSecurity.includes('process.env.NODE_ENV !== "production"'), "WhatsApp signature verification must fail closed in production when app secret is missing.");
assert(whatsappSecurity.includes("Buffer.byteLength(expected)"), "WhatsApp signature comparison must check buffer lengths before timingSafeEqual.");
assert(whatsappSecurity.includes("timingSafeEqual"), "WhatsApp signature verification must use timingSafeEqual.");

const stripeProvider = read("packages/backend/src/payments/stripe/provider.ts");
assert(stripeProvider.includes("webhookToleranceSeconds"), "Stripe webhook verification must enforce timestamp replay tolerance.");
assert(stripeProvider.includes("ageSeconds > this.webhookToleranceSeconds"), "Stripe webhook verification must reject stale signatures.");
assert(stripeProvider.includes("Buffer.byteLength(expected)"), "Stripe signature comparison must check buffer lengths before timingSafeEqual.");
assert(stripeProvider.includes("timingSafeEqual"), "Stripe signature verification must use timingSafeEqual.");

const whatsappRepository = read("packages/backend/src/integrations/whatsapp/whatsapp.repository.ts");
assert(whatsappRepository.includes("withPrismaAuthContext"), "WhatsApp webhook repository must execute under RLS context.");
assert(!whatsappRepository.includes("getPrismaClient"), "WhatsApp webhook repository must not use direct Prisma client.");
assert(whatsappRepository.includes('processingStatus: "DUPLICATE"'), "WhatsApp webhook repository must detect duplicate provider events.");
assert(whatsappRepository.includes("findFirst"), "WhatsApp webhook repository must check providerEventId before insert.");

const whatsappWebhook = read("packages/backend/src/integrations/whatsapp/whatsapp.webhook.ts");
assert(whatsappWebhook.includes('event.processingStatus === "DUPLICATE"'), "WhatsApp webhook processor must skip duplicate events safely.");

const paymentService = read("packages/backend/src/domains/payments/service.ts");
assert(paymentService.includes("processingStatus: \"DUPLICATE\""), "Payment webhook ledger must mark duplicate provider events.");
assert(paymentService.includes("providerEventId"), "Payment webhook ledger must key events by providerEventId.");

if (failures.length > 0) {
  console.error("Webhook hardening validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Webhook hardening validation passed.");
console.log("Invalid signatures fail closed, stale Stripe signatures are rejected, and duplicate provider events are safe.");
