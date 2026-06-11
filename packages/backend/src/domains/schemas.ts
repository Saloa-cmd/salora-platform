import { z } from "zod";

export const customerInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(32).optional(),
  preferences: z.record(z.string(), z.unknown()).default({})
});

export const productInputSchema = z.object({
  slug: z.string().min(2).max(140),
  name: z.string().min(2).max(160),
  category: z.string().min(2).max(120),
  description: z.string().min(4),
  basePrice: z.number().positive(),
  tags: z.array(z.string()).default([]),
  pairingHint: z.string().optional()
});

export const orderInputSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(2).max(120).optional(),
  customerPhone: z.string().min(6).max(32).optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(2),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative()
  })).min(1)
});

export const inventoryInputSchema = z.object({
  ingredientName: z.string().min(2).max(160),
  unit: z.string().min(1).max(32),
  quantity: z.number(),
  reorderThreshold: z.number().nonnegative().default(0),
  reason: z.string().optional()
});

export const loyaltyInputSchema = z.object({
  customerId: z.string(),
  points: z.number().int(),
  reason: z.string().min(2).max(180)
});

export const notificationInputSchema = z.object({
  recipient: z.string().min(3).max(255),
  channel: z.enum(["EMAIL", "SMS", "PUSH", "IN_APP"]),
  templateKey: z.string().min(2).max(120).optional(),
  payload: z.record(z.string(), z.unknown()).default({})
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;
export type InventoryInput = z.infer<typeof inventoryInputSchema>;
export type LoyaltyInput = z.infer<typeof loyaltyInputSchema>;
export type NotificationInput = z.infer<typeof notificationInputSchema>;
