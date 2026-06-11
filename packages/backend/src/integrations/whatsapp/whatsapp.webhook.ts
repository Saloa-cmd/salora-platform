import type { Product } from "@salora/types";
import { verifyWhatsAppChallenge, verifyWhatsAppSignature } from "../../channels/whatsapp/security";
import { handleWhatsAppWebhook } from "../../channels/whatsapp/webhook";
import { PrismaWhatsAppRepository } from "./whatsapp.repository";
import type { WhatsAppRepository } from "./whatsapp.types";
import { classifyWebhookEvent, extractProviderEventId } from "./whatsapp.validator";

export class WhatsAppEnterpriseWebhook {
  constructor(private readonly repository: WhatsAppRepository = new PrismaWhatsAppRepository()) {}

  verify(input: { mode?: string | null; token?: string | null; challenge?: string | null }) {
    return verifyWhatsAppChallenge(input);
  }

  verifySignature(rawBody: string, signature?: string | null) {
    return verifyWhatsAppSignature(rawBody, signature);
  }

  async process(payload: unknown, products: Product[], correlationId: string) {
    const event = await this.repository.createWebhookEvent({
      payload,
      eventType: classifyWebhookEvent(payload),
      providerEventId: extractProviderEventId(payload),
      correlationId
    });

    if (event.processingStatus === "DUPLICATE") {
      return { eventId: event.id, duplicate: true, receivedMessages: 0, receivedStatuses: 0, results: [] };
    }

    try {
      const result = await handleWhatsAppWebhook(payload, products);
      await this.repository.markWebhookEventProcessed(event.id);
      await this.repository.writeMutationLogs({
        action: "whatsapp.webhookProcess",
        entityType: "WhatsappWebhookEvent",
        entityId: event.id,
        requestId: correlationId,
        metadata: { eventType: event.eventType, providerEventId: event.providerEventId },
        after: result,
        reason: "WhatsApp webhook processed"
      });
      return { eventId: event.id, ...result };
    } catch (error) {
      await this.repository.markWebhookEventFailed(event.id, error);
      await this.repository.writeMutationLogs({
        action: "whatsapp.webhookDeadLetter",
        entityType: "WhatsappWebhookEvent",
        entityId: event.id,
        requestId: correlationId,
        metadata: {
          eventType: event.eventType,
          providerEventId: event.providerEventId,
          error: error instanceof Error ? error.message : "Unknown webhook failure"
        },
        reason: "WhatsApp webhook moved to dead-letter state"
      });
      throw error;
    }
  }
}

export function createWhatsAppEnterpriseWebhook() {
  return new WhatsAppEnterpriseWebhook();
}
