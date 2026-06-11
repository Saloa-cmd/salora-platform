import type { ChannelDelivery, ChannelMessage, ChannelProvider, ChannelTemplateMessage } from "../provider";
import { recordChannelDelivery, recordChannelFailure, recordChannelOutbound } from "../metrics";
import { assertWhatsAppReady, getWhatsAppEnv, whatsappEnabled } from "./config";

function disabledDelivery(reason = "WhatsApp channel is disabled."): ChannelDelivery {
  return { channel: "whatsapp", status: "disabled", reason };
}

export class WhatsAppChannelProvider implements ChannelProvider {
  channel = "whatsapp" as const;

  async sendMessage(message: ChannelMessage): Promise<ChannelDelivery> {
    if (!whatsappEnabled()) return disabledDelivery();

    try {
      const env = assertWhatsAppReady();
      const response = await fetch(`https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.to,
          type: "text",
          text: { preview_url: false, body: message.text }
        })
      });

      if (!response.ok) {
        recordChannelFailure("whatsapp");
        return { channel: "whatsapp", status: "failed", reason: `WhatsApp send failed: ${response.status}` };
      }

      const data = await response.json() as { messages?: Array<{ id?: string }> };
      recordChannelOutbound("whatsapp");
      recordChannelDelivery("whatsapp", "sent");
      return { channel: "whatsapp", status: "sent", providerMessageId: data.messages?.[0]?.id };
    } catch (error) {
      recordChannelFailure("whatsapp");
      return { channel: "whatsapp", status: "failed", reason: error instanceof Error ? error.message : "Unknown WhatsApp send failure." };
    }
  }

  async sendNotification(message: ChannelMessage): Promise<ChannelDelivery> {
    return this.sendMessage(message);
  }

  async sendTemplate(message: ChannelTemplateMessage): Promise<ChannelDelivery> {
    if (!whatsappEnabled()) return disabledDelivery();

    try {
      const env = assertWhatsAppReady();
      const response = await fetch(`https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.to,
          type: "template",
          template: {
            name: message.templateName,
            language: { code: message.locale ?? "en" },
            components: message.parameters?.length ? [{ type: "body", parameters: message.parameters.map((text) => ({ type: "text", text })) }] : undefined
          }
        })
      });

      if (!response.ok) {
        recordChannelFailure("whatsapp");
        return { channel: "whatsapp", status: "failed", reason: `WhatsApp template failed: ${response.status}` };
      }

      const data = await response.json() as { messages?: Array<{ id?: string }> };
      recordChannelOutbound("whatsapp");
      recordChannelDelivery("whatsapp", "sent");
      return { channel: "whatsapp", status: "sent", providerMessageId: data.messages?.[0]?.id };
    } catch (error) {
      recordChannelFailure("whatsapp");
      return { channel: "whatsapp", status: "failed", reason: error instanceof Error ? error.message : "Unknown WhatsApp template failure." };
    }
  }

  async trackDelivery(providerMessageId: string, status: ChannelDelivery["status"]): Promise<ChannelDelivery> {
    const env = getWhatsAppEnv();
    const delivery = { channel: "whatsapp" as const, providerMessageId, status, reason: env.WHATSAPP_ENABLED === "true" ? undefined : "Tracked while channel disabled." };
    recordChannelDelivery("whatsapp", status);
    return delivery;
  }
}
