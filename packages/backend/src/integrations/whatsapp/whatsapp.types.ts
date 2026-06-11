import type { ChannelDelivery } from "../../channels/provider";

export type WhatsAppMessageKind = "text" | "template" | "media";

export type WhatsAppTextMessage = {
  kind: "text";
  to: string;
  text: string;
  previewUrl?: boolean;
  correlationId: string;
  customerId?: string;
  conversationId?: string;
};

export type WhatsAppTemplateMessage = {
  kind: "template";
  to: string;
  templateName: string;
  locale?: string;
  parameters?: string[];
  correlationId: string;
  customerId?: string;
  conversationId?: string;
};

export type WhatsAppMediaMessage = {
  kind: "media";
  to: string;
  mediaType: "image" | "document" | "audio" | "video";
  mediaId?: string;
  link?: string;
  caption?: string;
  filename?: string;
  correlationId: string;
  customerId?: string;
  conversationId?: string;
};

export type WhatsAppSendInput = WhatsAppTextMessage | WhatsAppTemplateMessage | WhatsAppMediaMessage;

export type WhatsAppClientResult = {
  status: ChannelDelivery["status"];
  providerMessageId?: string;
  response?: unknown;
  reason?: string;
};

export type WhatsAppWebhookEventStatus = "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED" | "DUPLICATE";

export type WhatsAppWebhookLedgerEvent = {
  id: string;
  eventType: string;
  providerEventId?: string;
  correlationId: string;
  processingStatus: WhatsAppWebhookEventStatus;
};

export type WhatsAppRuntimeControls = {
  aiPaused?: boolean;
  escalateToHuman?: boolean;
  templates?: Record<string, string>;
};

export type WhatsAppRepository = {
  createWebhookEvent(input: {
    payload: unknown;
    eventType: string;
    providerEventId?: string;
    correlationId: string;
  }): Promise<WhatsAppWebhookLedgerEvent>;
  markWebhookEventProcessed(id: string): Promise<void>;
  markWebhookEventFailed(id: string, error: unknown): Promise<void>;
  writeMutationLogs(input: {
    action: string;
    entityType: string;
    entityId?: string;
    requestId: string;
    metadata?: Record<string, unknown>;
    after?: unknown;
    reason?: string;
  }): Promise<void>;
};

export type WhatsAppClient = {
  send(input: WhatsAppSendInput): Promise<WhatsAppClientResult>;
};
