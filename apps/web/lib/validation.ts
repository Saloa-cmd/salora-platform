import { products } from "@salora/data";
import { z } from "zod";

const productIds = new Set(products.map((product) => product.id));

export const orderPreviewSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(6).max(32),
    orderType: z.enum(["Pickup", "Delivery"]),
    notes: z.string().trim().max(500).optional()
  }),
  items: z.array(
    z.object({
      productId: z.string().refine((value) => productIds.has(value), "Unknown SALORA product id"),
      quantity: z.number().int().min(1).max(20)
    })
  ).min(1).max(30)
});

export type OrderPreviewInput = z.infer<typeof orderPreviewSchema>;
