import type { CreatePaymentIntentInput, PaymentStatus, RefundPaymentInput, RefundStatus } from "../domains/payments/schemas";

export type PaymentProviderName = "mock" | "stripe";

export type NormalizedPaymentIntent = {
  provider: PaymentProviderName;
  providerPaymentIntentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  clientSecretReference?: string;
  metadata: Record<string, unknown>;
};

export type NormalizedRefund = {
  provider: PaymentProviderName;
  providerRefundId: string;
  status: RefundStatus;
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
};

export type NormalizedPaymentEvent = {
  provider: PaymentProviderName;
  providerEventId: string;
  eventType: "payment_succeeded" | "payment_failed" | "payment_canceled" | "refund_succeeded" | "refund_failed";
  providerPaymentIntentId?: string;
  providerRefundId?: string;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  metadata: Record<string, unknown>;
};

export interface PaymentProvider {
  provider: PaymentProviderName;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<NormalizedPaymentIntent>;
  confirmPayment(paymentIntentId: string): Promise<NormalizedPaymentIntent>;
  cancelPayment(paymentIntentId: string): Promise<NormalizedPaymentIntent>;
  createRefund(input: RefundPaymentInput & { providerPaymentIntentId?: string }): Promise<NormalizedRefund>;
  parseWebhookEvent(rawBody: string, signature?: string | null): Promise<NormalizedPaymentEvent>;
  verifyWebhookSignature(rawBody: string, signature?: string | null): boolean;
  getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus>;
  getRefundStatus(refundId: string): Promise<RefundStatus>;
}
