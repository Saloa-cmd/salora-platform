import { z } from "zod";

export const conversationChannelSchema = z.enum(["web", "mobile", "whatsapp", "future_voice"]);
export const messageDirectionSchema = z.enum(["inbound", "outbound"]);
export const messageStatusSchema = z.enum(["received", "queued", "sent", "delivered", "read", "failed"]);

export const conversationInputSchema = z.object({
  channel: conversationChannelSchema,
  customerId: z.string().optional(),
  customerPhone: z.string().min(6).max(32).optional(),
  orderId: z.string().optional(),
  loyaltyAccountId: z.string().optional(),
  aiCorrelationId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const messageInputSchema = z.object({
  conversationId: z.string(),
  channel: conversationChannelSchema,
  direction: messageDirectionSchema,
  status: messageStatusSchema,
  text: z.string().max(4000).optional(),
  providerMessageId: z.string().optional(),
  customerId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export type ConversationInput = z.infer<typeof conversationInputSchema>;
export type MessageInput = z.infer<typeof messageInputSchema>;
export type ConversationChannel = z.infer<typeof conversationChannelSchema>;
export type MessageStatus = z.infer<typeof messageStatusSchema>;
export type CustomerContext = Pick<ConversationInput, "customerId" | "customerPhone" | "orderId" | "loyaltyAccountId" | "aiCorrelationId">;
