import { z } from "zod";

export const paymentStatusSchema = z.enum(["PENDING", "REQUIRES_ACTION", "AUTHORIZED", "PAID", "FAILED", "CANCELED", "REFUNDED", "PARTIALLY_REFUNDED"]);
export const refundStatusSchema = z.enum(["PENDING", "SUCCEEDED", "FAILED", "CANCELED"]);
export const orderPaymentStateSchema = z.enum(["UNPAID", "PAYMENT_PENDING", "PAID", "PAYMENT_FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]);

export const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(8).default("OMR"),
  idempotencyKey: z.string().min(8).max(160).optional(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1)
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(2).max(180).optional(),
  idempotencyKey: z.string().min(8).max(160).optional()
});

export const paymentStatusRequestSchema = z.object({
  paymentId: z.string().min(1)
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type RefundStatus = z.infer<typeof refundStatusSchema>;
export type OrderPaymentState = z.infer<typeof orderPaymentStateSchema>;
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
