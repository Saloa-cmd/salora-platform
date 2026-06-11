import type { PaymentProvider, NormalizedPaymentEvent, NormalizedPaymentIntent, NormalizedRefund } from "../types";
import type { CreatePaymentIntentInput, PaymentStatus, RefundPaymentInput, RefundStatus } from "../../domains/payments/schemas";

const intents = new Map<string, NormalizedPaymentIntent>();
const refunds = new Map<string, NormalizedRefund>();

function id(prefix: string, seed: string) {
  return `${prefix}_${Buffer.from(seed).toString("base64url").slice(0, 18)}`;
}

export class MockPaymentProvider implements PaymentProvider {
  provider = "mock" as const;

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<NormalizedPaymentIntent> {
    const providerPaymentIntentId = id("pi_mock", input.idempotencyKey ?? input.orderId);
    const status: PaymentStatus = input.metadata.mockStatus === "failed" ? "FAILED" : input.metadata.mockStatus === "canceled" ? "CANCELED" : "PENDING";
    const intent = {
      provider: this.provider,
      providerPaymentIntentId,
      status,
      amount: input.amount,
      currency: input.currency,
      clientSecretReference: `mock_client_secret_${providerPaymentIntentId}`,
      metadata: { orderId: input.orderId, mock: true }
    };
    intents.set(providerPaymentIntentId, intent);
    return intent;
  }

  async confirmPayment(paymentIntentId: string): Promise<NormalizedPaymentIntent> {
    const intent = intents.get(paymentIntentId);
    if (!intent) throw new Error("Mock payment intent not found.");
    const confirmed = { ...intent, status: intent.status === "FAILED" || intent.status === "CANCELED" ? intent.status : "PAID" as const };
    intents.set(paymentIntentId, confirmed);
    return confirmed;
  }

  async cancelPayment(paymentIntentId: string): Promise<NormalizedPaymentIntent> {
    const intent = intents.get(paymentIntentId);
    if (!intent) throw new Error("Mock payment intent not found.");
    const canceled = { ...intent, status: "CANCELED" as const };
    intents.set(paymentIntentId, canceled);
    return canceled;
  }

  async createRefund(input: RefundPaymentInput): Promise<NormalizedRefund> {
    const providerRefundId = id("re_mock", input.idempotencyKey ?? input.paymentId);
    const refund = {
      provider: this.provider,
      providerRefundId,
      status: input.reason === "fail" ? "FAILED" as const : "SUCCEEDED" as const,
      amount: input.amount,
      currency: "OMR",
      metadata: { mock: true }
    };
    refunds.set(providerRefundId, refund);
    return refund;
  }

  async parseWebhookEvent(rawBody: string): Promise<NormalizedPaymentEvent> {
    const parsed = JSON.parse(rawBody || "{}") as Partial<NormalizedPaymentEvent>;
    return {
      provider: "mock",
      providerEventId: parsed.providerEventId ?? id("evt_mock", rawBody || "empty"),
      eventType: parsed.eventType ?? "payment_succeeded",
      providerPaymentIntentId: parsed.providerPaymentIntentId,
      providerRefundId: parsed.providerRefundId,
      paymentId: parsed.paymentId,
      orderId: parsed.orderId,
      amount: parsed.amount,
      metadata: parsed.metadata ?? { mock: true }
    };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    return intents.get(paymentIntentId)?.status ?? "PENDING";
  }

  async getRefundStatus(refundId: string): Promise<RefundStatus> {
    return refunds.get(refundId)?.status ?? "PENDING";
  }
}
