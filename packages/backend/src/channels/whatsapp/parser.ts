import { whatsappWebhookSchema, type WhatsAppInboundMessage, type WhatsAppStatusUpdate } from "./types";
import { sanitizeWhatsAppText } from "./security";

export function parseWhatsAppWebhook(payload: unknown): { messages: WhatsAppInboundMessage[]; statuses: WhatsAppStatusUpdate[] } {
  const parsed = whatsappWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    return { messages: [], statuses: [] };
  }

  const messages: WhatsAppInboundMessage[] = [];
  const statuses: WhatsAppStatusUpdate[] = [];

  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      const contactByPhone = new Map((change.value.contacts ?? []).map((contact) => [contact.wa_id, contact.profile?.name]));
      for (const message of change.value.messages ?? []) {
        if (message.type !== "text" || !message.text?.body) continue;
        messages.push({
          providerMessageId: message.id,
          from: message.from,
          customerName: contactByPhone.get(message.from),
          text: sanitizeWhatsAppText(message.text.body),
          timestamp: message.timestamp
        });
      }

      for (const status of change.value.statuses ?? []) {
        if (!["sent", "delivered", "read", "failed"].includes(status.status)) continue;
        statuses.push({
          providerMessageId: status.id,
          status: status.status as WhatsAppStatusUpdate["status"],
          recipientId: status.recipient_id,
          timestamp: status.timestamp
        });
      }
    }
  }

  return { messages, statuses };
}
