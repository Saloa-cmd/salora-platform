import { z } from "zod";

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const paymentEnvSchema = z.object({
  PAYMENTS_ENABLED: z.enum(["true", "false"]).default("false"),
  PAYMENT_PROVIDER: z.enum(["mock", "stripe"]).default("mock"),
  STRIPE_ENABLED: z.enum(["true", "false"]).default("false"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_API_VERSION: z.string().default("2025-01-27.acacia"),
  PAYMENT_INTENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  PAYMENT_MAX_RETRIES: z.coerce.number().int().min(0).default(2),
  PAYMENT_WEBHOOK_IDEMPOTENCY_TTL_DAYS: z.coerce.number().int().positive().default(30)
});

export type PaymentEnv = z.infer<typeof paymentEnvSchema>;

export function getPaymentEnv(): PaymentEnv {
  const parsed = paymentEnvSchema.safeParse(runtimeEnv);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`SALORA payment env invalid: ${message}`);
  }
  return parsed.data;
}

export function paymentsEnabled() {
  return getPaymentEnv().PAYMENTS_ENABLED === "true";
}

export function stripeEnabled() {
  const env = getPaymentEnv();
  return env.PAYMENTS_ENABLED === "true" && env.STRIPE_ENABLED === "true";
}
