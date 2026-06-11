import { assertRateLimit } from "../ai/governance/governance";
import { recordRevenueMetric } from "./metrics";
import { getPaymentProvider } from "./registry";
import { assertNoCardData, paymentRateLimitKey } from "./security";
import {
  addPaymentAuditLog,
  cancelPaymentRecord,
  createPaymentRecord,
  createRefundRecord,
  getPayment,
  markPaymentEventProcessed,
  markPaymentFailed,
  markPaymentSucceeded,
  recordPaymentEvent,
  synchronizeRefundSuccess,
  validateOrderForPayment
} from "../domains/payments/service";
import type { ConfirmPaymentInput, CreatePaymentIntentInput, RefundPaymentInput } from "../domains/payments/schemas";
import { recordPaymentFailure, recordPaymentIntent, recordPaymentLatency, recordPaymentProviderLatency, recordPaymentSuccess, recordPaymentWebhookDuplicate, recordPaymentWebhookFailure, recordRefund } from "./metrics";

export async function createRevenuePaymentIntent(input: CreatePaymentIntentInput) {
  const started = Date.now();
  assertNoCardData(input);
  await assertRateLimit(paymentRateLimitKey(input.customerId, input.orderId));
  validateOrderForPayment(input.orderId);
  const provider = getPaymentProvider();
  const providerStarted = Date.now();
  const intent = await provider.createPaymentIntent({ ...input, idempotencyKey: input.idempotencyKey ?? `payment-${input.orderId}` });
  recordPaymentProviderLatency(provider.provider, Date.now() - providerStarted);
  const payment = createPaymentRecord({
    ...input,
    provider: provider.provider,
    providerPaymentId: intent.providerPaymentIntentId,
    status: intent.status,
    idempotencyKey: input.idempotencyKey ?? `payment-${input.orderId}`
  });
  addPaymentAuditLog(payment.id, "PAYMENT_INTENT_CREATED", { provider: provider.provider });
  recordPaymentIntent();
  recordPaymentLatency(Date.now() - started);
  return { payment, intent };
}

export async function confirmRevenuePayment(input: ConfirmPaymentInput) {
  const payment = getPayment(input.paymentId);
  if (!payment) throw new Error("Payment not found.");
  const provider = getPaymentProvider(payment.provider === "stripe" ? "stripe" : "mock");
  const result = await provider.confirmPayment(input.providerPaymentIntentId ?? payment.providerPaymentId ?? payment.id);
  if (result.status === "PAID") {
    recordPaymentSuccess();
    const updated = markPaymentSucceeded(payment.id, result.providerPaymentIntentId);
    recordRevenueMetric("gross_revenue", updated.amount);
    return updated;
  }
  if (result.status === "CANCELED") return cancelPaymentRecord(payment.id);
  recordPaymentFailure();
  return markPaymentFailed(payment.id, "Provider confirmation did not succeed.");
}

export async function createRevenueRefund(input: RefundPaymentInput) {
  assertNoCardData(input);
  const payment = getPayment(input.paymentId);
  if (!payment) throw new Error("Payment not found.");
  const provider = getPaymentProvider(payment.provider === "stripe" ? "stripe" : "mock");
  const result = await provider.createRefund({ ...input, providerPaymentIntentId: payment.providerPaymentId });
  const refund = createRefundRecord({
    ...input,
    provider: provider.provider,
    providerRefundId: result.providerRefundId,
    status: result.status
  });
  addPaymentAuditLog(payment.id, "REFUND_CREATED", { refundId: refund.id, status: refund.status });
  recordRefund();
  if (refund.status === "SUCCEEDED") {
    synchronizeRefundSuccess(refund);
    recordRevenueMetric("refund_amount", refund.amount);
  }
  return refund;
}

export async function processPaymentWebhook(input: { providerName?: "mock" | "stripe"; rawBody: string; signature?: string | null }) {
  const provider = getPaymentProvider(input.providerName);
  try {
    const event = await provider.parseWebhookEvent(input.rawBody, input.signature);
    const stored = recordPaymentEvent({
      provider: event.provider,
      providerEventId: event.providerEventId,
      eventType: event.eventType,
      processingStatus: "PROCESSING",
      paymentId: event.paymentId,
      relatedOrderId: event.orderId
    });
    if (stored.processingStatus === "DUPLICATE") {
      recordPaymentWebhookDuplicate();
      return { duplicate: true, event: stored };
    }
    if (event.eventType === "payment_succeeded" && event.paymentId) {
      markPaymentSucceeded(event.paymentId, event.providerPaymentIntentId);
      recordPaymentSuccess();
    } else if (event.eventType === "payment_failed" && event.paymentId) {
      markPaymentFailed(event.paymentId, "Webhook payment failure.");
      recordPaymentFailure();
    } else if (event.eventType === "payment_canceled" && event.paymentId) {
      cancelPaymentRecord(event.paymentId);
    }
    markPaymentEventProcessed(event.provider, event.providerEventId);
    return { duplicate: false, event };
  } catch (error) {
    recordPaymentWebhookFailure();
    throw error;
  }
}

export function getRevenuePaymentStatus(paymentId: string) {
  const payment = getPayment(paymentId);
  if (!payment) throw new Error("Payment not found.");
  return payment;
}
