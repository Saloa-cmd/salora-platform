import { incrementMetric } from "../../runtime/metrics";
import { publishDomainEvent } from "../events";
import { awardLoyaltyPoints, listOrders, queueNotification } from "../services";
import type { CreatePaymentIntentInput, PaymentStatus, RefundPaymentInput, RefundStatus } from "./schemas";

export type PaymentRecord = {
  id: string;
  orderId: string;
  customerId?: string;
  provider: string;
  providerPaymentId?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type RefundRecord = {
  id: string;
  paymentId: string;
  provider: string;
  providerRefundId?: string;
  status: RefundStatus;
  amount: number;
  currency: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentEventRecord = {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  processingStatus: "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED" | "DUPLICATE";
  paymentId?: string;
  relatedOrderId?: string;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
};

const store = {
  payments: [] as PaymentRecord[],
  refunds: [] as RefundRecord[],
  events: [] as PaymentEventRecord[],
  auditLogs: [] as Array<{ id: string; paymentId?: string; action: string; createdAt: string; metadata: Record<string, unknown> }>,
  orderPaymentStates: new Map<string, "UNPAID" | "PAYMENT_PENDING" | "PAID" | "PAYMENT_FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED">()
};

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

export function createPaymentRecord(input: CreatePaymentIntentInput & { provider: string; providerPaymentId?: string; status?: PaymentStatus }): PaymentRecord {
  const existing = store.payments.find((payment) => payment.idempotencyKey === input.idempotencyKey);
  if (existing) return existing;

  const payment: PaymentRecord = {
    id: id(),
    orderId: input.orderId,
    customerId: input.customerId,
    provider: input.provider,
    providerPaymentId: input.providerPaymentId,
    status: input.status ?? "PENDING",
    amount: input.amount,
    currency: input.currency,
    idempotencyKey: input.idempotencyKey ?? `payment-${input.orderId}-${Date.now()}`,
    metadata: input.metadata,
    createdAt: now(),
    updatedAt: now()
  };
  store.payments.push(payment);
  store.orderPaymentStates.set(input.orderId, "PAYMENT_PENDING");
  incrementMetric("salora_payment_intents_created_total");
  publishDomainEvent({ name: "PaymentIntentCreated", aggregateId: payment.id, aggregateType: "Payment", payload: { orderId: payment.orderId, amount: payment.amount } });
  return payment;
}

export function markPaymentSucceeded(paymentId: string, providerPaymentId?: string): PaymentRecord {
  const payment = getPayment(paymentId);
  if (!payment) throw new Error("Payment not found.");
  if (payment.status === "PAID") return payment;

  payment.status = "PAID";
  payment.providerPaymentId = providerPaymentId ?? payment.providerPaymentId;
  payment.updatedAt = now();
  store.orderPaymentStates.set(payment.orderId, "PAID");
  incrementMetric("salora_payment_success_total");
  publishDomainEvent({ name: "PaymentSucceeded", aggregateId: payment.id, aggregateType: "Payment", payload: { orderId: payment.orderId, amount: payment.amount } });

  if (payment.customerId) {
    awardLoyaltyPoints({ customerId: payment.customerId, points: Math.floor(payment.amount), reason: `Paid order ${payment.orderId}` });
    publishDomainEvent({ name: "LoyaltyPointsAwarded", aggregateId: payment.customerId, aggregateType: "LoyaltyAccount", payload: { paymentId: payment.id } });
  }

  queueNotification({
    recipient: payment.customerId ?? payment.orderId,
    channel: "IN_APP",
    templateKey: "payment_succeeded",
    payload: { paymentId: payment.id, orderId: payment.orderId }
  });
  return payment;
}

export function markPaymentFailed(paymentId: string, reason = "Payment failed."): PaymentRecord {
  const payment = getPayment(paymentId);
  if (!payment) throw new Error("Payment not found.");
  payment.status = "FAILED";
  payment.updatedAt = now();
  store.orderPaymentStates.set(payment.orderId, "PAYMENT_FAILED");
  incrementMetric("salora_payment_failures_total");
  publishDomainEvent({ name: "PaymentFailed", aggregateId: payment.id, aggregateType: "Payment", payload: { orderId: payment.orderId, reason } });
  return payment;
}

export function cancelPaymentRecord(paymentId: string): PaymentRecord {
  const payment = getPayment(paymentId);
  if (!payment) throw new Error("Payment not found.");
  payment.status = "CANCELED";
  payment.updatedAt = now();
  store.orderPaymentStates.set(payment.orderId, "UNPAID");
  publishDomainEvent({ name: "PaymentCanceled", aggregateId: payment.id, aggregateType: "Payment", payload: { orderId: payment.orderId } });
  return payment;
}

export function createRefundRecord(input: RefundPaymentInput & { provider: string; providerRefundId?: string; status?: RefundStatus }): RefundRecord {
  const payment = getPayment(input.paymentId);
  if (!payment) throw new Error("Payment not found.");
  const refund: RefundRecord = {
    id: id(),
    paymentId: input.paymentId,
    provider: input.provider,
    providerRefundId: input.providerRefundId,
    status: input.status ?? "PENDING",
    amount: input.amount,
    currency: payment.currency,
    reason: input.reason,
    createdAt: now(),
    updatedAt: now()
  };
  store.refunds.push(refund);
  incrementMetric("salora_refunds_created_total");
  if (refund.status === "SUCCEEDED") {
    synchronizeRefundSuccess(refund);
  }
  return refund;
}

export function synchronizeRefundSuccess(refund: RefundRecord): void {
  const payment = getPayment(refund.paymentId);
  if (!payment) return;
  const totalRefunded = store.refunds.filter((item) => item.paymentId === payment.id && item.status === "SUCCEEDED").reduce((sum, item) => sum + item.amount, 0);
  payment.status = totalRefunded >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
  payment.updatedAt = now();
  store.orderPaymentStates.set(payment.orderId, payment.status === "REFUNDED" ? "REFUNDED" : "PARTIALLY_REFUNDED");
  incrementMetric("salora_refunds_succeeded_total");
  publishDomainEvent({ name: "RefundIssued", aggregateId: refund.id, aggregateType: "Refund", payload: { paymentId: payment.id, amount: refund.amount } });
  if (payment.customerId) {
    awardLoyaltyPoints({ customerId: payment.customerId, points: -Math.floor(refund.amount), reason: `Refund for order ${payment.orderId}` });
    publishDomainEvent({ name: "LoyaltyPointsReversed", aggregateId: payment.customerId, aggregateType: "LoyaltyAccount", payload: { paymentId: payment.id, refundId: refund.id } });
  }
}

export function recordPaymentEvent(input: Omit<PaymentEventRecord, "id" | "createdAt">): PaymentEventRecord {
  const existing = store.events.find((event) => event.provider === input.provider && event.providerEventId === input.providerEventId);
  if (existing) {
    incrementMetric("salora_payment_webhook_duplicates_total");
    return { ...existing, processingStatus: "DUPLICATE" };
  }
  const event = { ...input, id: id(), createdAt: now() };
  store.events.push(event);
  return event;
}

export function markPaymentEventProcessed(provider: string, providerEventId: string): void {
  const event = store.events.find((item) => item.provider === provider && item.providerEventId === providerEventId);
  if (!event) return;
  event.processingStatus = "PROCESSED";
  event.processedAt = now();
}

export function addPaymentAuditLog(paymentId: string | undefined, action: string, metadata: Record<string, unknown> = {}) {
  store.auditLogs.push({ id: id(), paymentId, action, metadata, createdAt: now() });
}

export function getPayment(paymentId: string): PaymentRecord | undefined {
  return store.payments.find((payment) => payment.id === paymentId);
}

export function getPaymentByOrder(orderId: string): PaymentRecord | undefined {
  return store.payments.find((payment) => payment.orderId === orderId);
}

export function listPayments(): PaymentRecord[] {
  return [...store.payments];
}

export function listRefunds(): RefundRecord[] {
  return [...store.refunds];
}

export function listPaymentEvents(): PaymentEventRecord[] {
  return [...store.events];
}

export function getOrderPaymentState(orderId: string) {
  return store.orderPaymentStates.get(orderId) ?? "UNPAID";
}

export function validateOrderForPayment(orderId: string) {
  const order = listOrders().find((item) => item.id === orderId);
  if (!order) throw new Error("Order not found.");
  return order;
}
