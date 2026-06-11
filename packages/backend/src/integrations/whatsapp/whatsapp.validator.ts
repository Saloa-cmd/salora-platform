import { z } from "zod";
import type { WhatsAppSendInput } from "./whatsapp.types";

const phoneSchema = z.string().min(6).max(32).regex(/^\+?[1-9]\d{5,31}$/);

export const whatsappSendSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    to: phoneSchema,
    text: z.string().min(1).max(4096),
    previewUrl: z.boolean().optional(),
    correlationId: z.string().min(8).max(80),
    customerId: z.string().uuid().optional(),
    conversationId: z.string().uuid().optional()
  }),
  z.object({
    kind: z.literal("template"),
    to: phoneSchema,
    templateName: z.string().min(1).max(512),
    locale: z.string().min(2).max(16).default("en"),
    parameters: z.array(z.string().max(1024)).max(20).default([]),
    correlationId: z.string().min(8).max(80),
    customerId: z.string().uuid().optional(),
    conversationId: z.string().uuid().optional()
  }),
  z.object({
    kind: z.literal("media"),
    to: phoneSchema,
    mediaType: z.enum(["image", "document", "audio", "video"]),
    mediaId: z.string().min(1).max(512).optional(),
    link: z.string().url().optional(),
    caption: z.string().max(1024).optional(),
    filename: z.string().max(240).optional(),
    correlationId: z.string().min(8).max(80),
    customerId: z.string().uuid().optional(),
    conversationId: z.string().uuid().optional()
  }).refine((value) => Boolean(value.mediaId || value.link), "Either mediaId or link is required.")
]);

export function validateWhatsAppSend(input: unknown): WhatsAppSendInput {
  return whatsappSendSchema.parse(input);
}

export function extractProviderEventId(payload: unknown): string | undefined {
  const body = payload as {
    entry?: Array<{ id?: string; changes?: Array<{ value?: { messages?: Array<{ id?: string }>; statuses?: Array<{ id?: string }> } }> }>;
  };
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const messageId = change.value?.messages?.[0]?.id;
      const statusId = change.value?.statuses?.[0]?.id;
      if (messageId || statusId) return messageId ?? statusId;
    }
    if (entry.id) return entry.id;
  }
  return undefined;
}

export function classifyWebhookEvent(payload: unknown): string {
  const body = payload as { entry?: Array<{ changes?: Array<{ value?: { messages?: unknown[]; statuses?: unknown[] } }> }> };
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.value?.messages?.length) return "message";
      if (change.value?.statuses?.length) return "status";
    }
  }
  return "unknown";
}
