import type { Product } from "@salora/types";
import { recordChannelWebhookFailure } from "../metrics";
import { parseWhatsAppWebhook } from "./parser";
import { handleWhatsAppInboundMessage, handleWhatsAppStatusUpdate } from "./service";

export async function handleWhatsAppWebhook(payload: unknown, products: Product[]) {
  const parsed = parseWhatsAppWebhook(payload);
  const messageResults = [];

  try {
    for (const status of parsed.statuses) {
      await handleWhatsAppStatusUpdate(status);
    }

    for (const message of parsed.messages) {
      messageResults.push(await handleWhatsAppInboundMessage({ message, products }));
    }
  } catch (error) {
    recordChannelWebhookFailure("whatsapp");
    throw error;
  }

  return {
    receivedMessages: parsed.messages.length,
    receivedStatuses: parsed.statuses.length,
    results: messageResults
  };
}
