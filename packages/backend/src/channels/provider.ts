export type ChannelName = "web" | "mobile" | "whatsapp" | "future_voice" | "email" | "push";

export type ChannelMessage = {
  to: string;
  text: string;
  customerId?: string;
  conversationId?: string;
  correlationId?: string;
};

export type ChannelTemplateMessage = {
  to: string;
  templateName: string;
  locale?: string;
  parameters?: string[];
  customerId?: string;
  conversationId?: string;
};

export type ChannelDelivery = {
  channel: ChannelName;
  providerMessageId?: string;
  status: "disabled" | "queued" | "sent" | "delivered" | "read" | "failed";
  reason?: string;
};

export interface ChannelProvider {
  channel: ChannelName;
  sendMessage(message: ChannelMessage): Promise<ChannelDelivery>;
  sendNotification(message: ChannelMessage): Promise<ChannelDelivery>;
  sendTemplate(message: ChannelTemplateMessage): Promise<ChannelDelivery>;
  trackDelivery(providerMessageId: string, status: ChannelDelivery["status"]): Promise<ChannelDelivery>;
}
