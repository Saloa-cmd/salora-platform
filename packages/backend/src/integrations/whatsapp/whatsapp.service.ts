import { addConversationMessageRuntime, findOrCreateConversationRuntime } from "../../domains/conversations/service";
import { publishDomainEvent } from "../../domains/events";
import type { WhatsAppClient, WhatsAppRepository, WhatsAppSendInput } from "./whatsapp.types";
import { WhatsAppCloudClient } from "./whatsapp.client";
import { PrismaWhatsAppRepository } from "./whatsapp.repository";

export class WhatsAppEnterpriseService {
  constructor(
    private readonly client: WhatsAppClient = new WhatsAppCloudClient(),
    private readonly repository: WhatsAppRepository = new PrismaWhatsAppRepository()
  ) {}

  async send(input: WhatsAppSendInput) {
    const conversation = input.conversationId
      ? { id: input.conversationId }
      : await findOrCreateConversationRuntime({
        channel: "whatsapp",
        customerId: input.customerId,
        customerPhone: input.to,
        metadata: { source: "whatsapp-enterprise-send", correlationId: input.correlationId }
      });

    const result = await this.client.send(input);
    const text = input.kind === "text"
      ? input.text
      : input.kind === "template"
        ? `template:${input.templateName}`
        : `media:${input.mediaType}`;

    await addConversationMessageRuntime({
      conversationId: conversation.id,
      channel: "whatsapp",
      direction: "outbound",
      status: result.status === "sent" ? "sent" : result.status === "queued" ? "queued" : "failed",
      text,
      providerMessageId: result.providerMessageId,
      customerId: input.customerId,
      metadata: {
        messageKind: input.kind,
        correlationId: input.correlationId,
        providerResult: result
      }
    });

    publishDomainEvent({
      name: "WhatsAppOutboundSent",
      aggregateId: result.providerMessageId ?? conversation.id,
      aggregateType: "WhatsAppMessage",
      payload: { status: result.status, correlationId: input.correlationId, messageKind: input.kind }
    });

    await this.repository.writeMutationLogs({
      action: "whatsapp.messageSend",
      entityType: "Conversation",
      entityId: conversation.id,
      requestId: input.correlationId,
      metadata: { messageKind: input.kind, status: result.status, providerMessageId: result.providerMessageId },
      after: { conversationId: conversation.id, delivery: result },
      reason: "WhatsApp Enterprise message send"
    });

    return { conversationId: conversation.id, delivery: result };
  }
}

export function createWhatsAppEnterpriseService() {
  return new WhatsAppEnterpriseService();
}

export type WhatsAppOrderNotificationEvent = "ORDER_CREATED" | "ORDER_CONFIRMED" | "ORDER_PREPARING" | "ORDER_READY" | "ORDER_DELIVERED";

const orderEventCopy: Record<WhatsAppOrderNotificationEvent, string> = {
  ORDER_CREATED: "Your SALORA order has been received. Payment is Cash on Delivery.",
  ORDER_CONFIRMED: "Your SALORA order has been confirmed.",
  ORDER_PREPARING: "Your SALORA order is now being prepared.",
  ORDER_READY: "Your SALORA order is ready.",
  ORDER_DELIVERED: "Your SALORA order has been delivered. Thank you for choosing SALORA."
};

export async function notifyWhatsAppOrderEvent(input: {
  event: WhatsAppOrderNotificationEvent;
  orderId: string;
  customerPhone?: string | null;
  customerName?: string | null;
  total?: number | string | null;
  correlationId: string;
}) {
  if (!input.customerPhone) {
    return { skipped: true, reason: "Order has no customer phone number." };
  }

  const total = input.total === undefined || input.total === null ? "" : `\nTotal: ${input.total} OMR`;
  const greeting = input.customerName ? `Hi ${input.customerName},\n` : "";
  const text = `${greeting}${orderEventCopy[input.event]}\nOrder: ${input.orderId}${total}`;
  const service = createWhatsAppEnterpriseService();

  return service.send({
    kind: "text",
    to: input.customerPhone,
    text,
    previewUrl: false,
    correlationId: input.correlationId
  });
}
