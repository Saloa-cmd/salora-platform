import { incrementMetric } from "../runtime/metrics";
import { activeCorrelationId } from "../observability/tracing";

export type DomainEventName =
  | "CustomerRegistered"
  | "ProductCreated"
  | "OrderCreated"
  | "InventoryLow"
  | "PointsAwarded"
  | "NotificationQueued"
  | "ConversationStarted"
  | "ConversationMessageRecorded"
  | "WhatsAppInboundReceived"
  | "WhatsAppOutboundSent"
  | "WhatsAppStatusUpdated"
  | "PaymentIntentCreated"
  | "PaymentSucceeded"
  | "PaymentFailed"
  | "PaymentCanceled"
  | "RefundIssued"
  | "RefundFailed"
  | "LoyaltyPointsAwarded"
  | "LoyaltyPointsReversed";

export type DomainEvent = {
  id: string;
  name: DomainEventName;
  aggregateId: string;
  aggregateType: string;
  occurredAt: string;
  correlationId: string;
  payload: Record<string, unknown>;
};

const events: DomainEvent[] = [];

export function publishDomainEvent(event: Omit<DomainEvent, "id" | "occurredAt" | "correlationId">): DomainEvent {
  const stored: DomainEvent = {
    ...event,
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    correlationId: activeCorrelationId()
  };
  events.push(stored);
  incrementMetric(`salora_domain_events_total`);
  return stored;
}

export function listDomainEvents(): DomainEvent[] {
  return [...events];
}
