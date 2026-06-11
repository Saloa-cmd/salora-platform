import { createHmac, timingSafeEqual } from "node:crypto";
import { getPaymentEnv, stripeEnabled } from "../config";
import type { PaymentProvider, NormalizedPaymentEvent, NormalizedPaymentIntent, NormalizedRefund } from "../types";
import type { CreatePaymentIntentInput, PaymentStatus, RefundPaymentInput, RefundStatus } from "../../domains/payments/schemas";

function mapStripeStatus(status?: string): PaymentStatus {
  if (status === "succeeded") return "PAID";
  if (status === "requires_action") return "REQUIRES_ACTION";
  if (status === "requires_capture") return "AUTHORIZED";
  if (status === "canceled") return "CANCELED";
  if (status === "requires_payment_method") return "FAILED";
  return "PENDING";
}

function mapStripeRefundStatus(status?: string): RefundStatus {
  if (status === "succeeded") return "SUCCEEDED";
  if (status === "failed") return "FAILED";
  if (status === "canceled") return "CANCELED";
  return "PENDING";
}

export class StripePaymentProvider implements PaymentProvider {
  provider = "stripe" as const;
  private readonly webhookToleranceSeconds = 300;

  private assertReady() {
    const env = getPaymentEnv();
    if (!stripeEnabled() || !env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe provider is disabled or missing credentials.");
    }
    return env;
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<NormalizedPaymentIntent> {
    const env = this.assertReady();
    const body = new URLSearchParams({
      amount: String(Math.round(input.amount * 1000)),
      currency: input.currency.toLowerCase(),
      "automatic_payment_methods[enabled]": "true",
      "automatic_payment_methods[allow_redirects]": "never",
      "metadata[orderId]": input.orderId,
      "metadata[saloraSource]": "salora"
    });
    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "stripe-version": env.STRIPE_API_VERSION,
        "idempotency-key": input.idempotencyKey ?? `salora-${input.orderId}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body
    });
    if (!response.ok) throw new Error(`Stripe payment intent failed: ${response.status}`);
    const data = await response.json() as { id: string; status?: string; amount: number; currency: string; client_secret?: string };
    return {
      provider: "stripe",
      providerPaymentIntentId: data.id,
      status: mapStripeStatus(data.status),
      amount: input.amount,
      currency: data.currency.toUpperCase(),
      clientSecretReference: data.client_secret ? `stripe:${data.id}` : undefined,
      metadata: { orderId: input.orderId }
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<NormalizedPaymentIntent> {
    const env = this.assertReady();
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "stripe-version": env.STRIPE_API_VERSION }
    });
    if (!response.ok) throw new Error(`Stripe confirm failed: ${response.status}`);
    const data = await response.json() as { id: string; status?: string; amount: number; currency: string };
    return { provider: "stripe", providerPaymentIntentId: data.id, status: mapStripeStatus(data.status), amount: data.amount / 1000, currency: data.currency.toUpperCase(), metadata: {} };
  }

  async cancelPayment(paymentIntentId: string): Promise<NormalizedPaymentIntent> {
    const env = this.assertReady();
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}/cancel`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "stripe-version": env.STRIPE_API_VERSION }
    });
    if (!response.ok) throw new Error(`Stripe cancel failed: ${response.status}`);
    const data = await response.json() as { id: string; status?: string; amount: number; currency: string };
    return { provider: "stripe", providerPaymentIntentId: data.id, status: mapStripeStatus(data.status), amount: data.amount / 1000, currency: data.currency.toUpperCase(), metadata: {} };
  }

  async createRefund(input: RefundPaymentInput & { providerPaymentIntentId?: string }): Promise<NormalizedRefund> {
    const env = this.assertReady();
    if (!input.providerPaymentIntentId) throw new Error("Stripe refund requires provider payment intent id.");
    const response = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "stripe-version": env.STRIPE_API_VERSION,
        "idempotency-key": input.idempotencyKey ?? `refund-${input.paymentId}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ payment_intent: input.providerPaymentIntentId, amount: String(Math.round(input.amount * 1000)) })
    });
    if (!response.ok) throw new Error(`Stripe refund failed: ${response.status}`);
    const data = await response.json() as { id: string; status?: string; amount: number; currency: string };
    return { provider: "stripe", providerRefundId: data.id, status: mapStripeRefundStatus(data.status), amount: data.amount / 1000, currency: data.currency.toUpperCase(), metadata: {} };
  }

  async parseWebhookEvent(rawBody: string, signature?: string | null): Promise<NormalizedPaymentEvent> {
    if (!this.verifyWebhookSignature(rawBody, signature)) throw new Error("Invalid Stripe webhook signature.");
    const event = JSON.parse(rawBody || "{}") as { id: string; type: string; data?: { object?: Record<string, unknown> } };
    const object = event.data?.object ?? {};
    const eventType = event.type === "payment_intent.succeeded" ? "payment_succeeded"
      : event.type === "payment_intent.payment_failed" ? "payment_failed"
        : event.type === "payment_intent.canceled" ? "payment_canceled"
          : event.type === "charge.refunded" ? "refund_succeeded"
            : "payment_failed";
    return {
      provider: "stripe",
      providerEventId: event.id,
      eventType,
      providerPaymentIntentId: String(object.id ?? object.payment_intent ?? ""),
      amount: typeof object.amount === "number" ? object.amount / 1000 : undefined,
      metadata: { stripeType: event.type }
    };
  }

  verifyWebhookSignature(rawBody: string, signature?: string | null): boolean {
    const secret = getPaymentEnv().STRIPE_WEBHOOK_SECRET;
    if (!stripeEnabled()) return false;
    if (!secret || !signature) return false;
    const timestamp = signature.match(/t=([^,]+)/)?.[1];
    const signatureValue = signature.match(/v1=([^,]+)/)?.[1];
    if (!timestamp || !signatureValue) return false;
    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds)) return false;
    const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
    if (ageSeconds > this.webhookToleranceSeconds) return false;
    const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    if (Buffer.byteLength(expected) !== Buffer.byteLength(signatureValue)) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureValue));
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    const env = this.assertReady();
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "stripe-version": env.STRIPE_API_VERSION }
    });
    if (!response.ok) throw new Error(`Stripe status failed: ${response.status}`);
    const data = await response.json() as { status?: string };
    return mapStripeStatus(data.status);
  }

  async getRefundStatus(refundId: string): Promise<RefundStatus> {
    const env = this.assertReady();
    const response = await fetch(`https://api.stripe.com/v1/refunds/${refundId}`, {
      headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "stripe-version": env.STRIPE_API_VERSION }
    });
    if (!response.ok) throw new Error(`Stripe refund status failed: ${response.status}`);
    const data = await response.json() as { status?: string };
    return mapStripeRefundStatus(data.status);
  }
}
