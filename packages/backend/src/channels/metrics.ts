import { incrementMetric, recordDuration } from "../runtime/metrics";

export function recordChannelInbound(channel: string): void {
  incrementMetric(`salora_channel_${channel}_inbound_total`);
}

export function recordChannelOutbound(channel: string): void {
  incrementMetric(`salora_channel_${channel}_outbound_total`);
}

export function recordChannelFailure(channel: string): void {
  incrementMetric(`salora_channel_${channel}_failures_total`);
}

export function recordChannelWebhookFailure(channel: string): void {
  incrementMetric(`salora_channel_${channel}_webhook_failures_total`);
}

export function recordChannelDelivery(channel: string, status: string): void {
  incrementMetric(`salora_channel_${channel}_delivery_${status}_total`);
}

export function recordChannelLatency(channel: string, ms: number): void {
  recordDuration(`salora_channel_${channel}_latency_ms`, ms);
}
