import { incrementMetric, recordDuration } from "../runtime/metrics";

export function recordPaymentIntent(): void {
  incrementMetric("salora_payment_intent_total");
}

export function recordPaymentSuccess(): void {
  incrementMetric("salora_payment_success_count");
}

export function recordPaymentFailure(): void {
  incrementMetric("salora_payment_failure_count");
}

export function recordRefund(): void {
  incrementMetric("salora_refund_count");
}

export function recordPaymentWebhookFailure(): void {
  incrementMetric("salora_payment_webhook_failures_total");
}

export function recordPaymentWebhookDuplicate(): void {
  incrementMetric("salora_payment_webhook_duplicates_total");
}

export function recordPaymentLatency(ms: number): void {
  recordDuration("salora_payment_latency_ms", ms);
}

export function recordPaymentProviderLatency(provider: string, ms: number): void {
  recordDuration(`salora_payment_provider_${provider}_latency_ms`, ms);
}

export function recordRevenueMetric(name: string, value: number): void {
  recordDuration(`salora_revenue_${name}`, value);
}
