import { z } from "zod";

export const whatsappWebhookSchema = z.object({
  object: z.string().optional(),
  entry: z.array(z.object({
    id: z.string().optional(),
    changes: z.array(z.object({
      field: z.string().optional(),
      value: z.object({
        messaging_product: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        contacts: z.array(z.object({
          wa_id: z.string().optional(),
          profile: z.object({ name: z.string().optional() }).optional()
        })).optional(),
        messages: z.array(z.object({
          id: z.string(),
          from: z.string(),
          timestamp: z.string().optional(),
          type: z.string(),
          text: z.object({ body: z.string() }).optional()
        })).optional(),
        statuses: z.array(z.object({
          id: z.string(),
          status: z.string(),
          timestamp: z.string().optional(),
          recipient_id: z.string().optional()
        })).optional()
      })
    })).default([])
  })).default([])
});

export type WhatsAppWebhookPayload = z.infer<typeof whatsappWebhookSchema>;

export type WhatsAppInboundMessage = {
  providerMessageId: string;
  from: string;
  customerName?: string;
  text: string;
  timestamp?: string;
};

export type WhatsAppStatusUpdate = {
  providerMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  recipientId?: string;
  timestamp?: string;
};
