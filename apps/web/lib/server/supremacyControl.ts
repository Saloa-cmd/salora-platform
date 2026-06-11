import { databaseHealth, queueHealth, redisHealth, SYSTEM_AUTH_CONTEXT, withPrismaAuthContext, type PrismaAuthContext } from "@salora/backend";
import { z } from "zod";
import { runAiDraft } from "./simpleLaunchControl";

export const mediaMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create-draft"),
    productSlug: z.string().min(2).max(140),
    source: z.enum(["manual", "upload", "ai_image", "ai_prompt"]).default("manual"),
    storagePath: z.string().min(2).optional(),
    publicUrl: z.string().url().optional(),
    prompt: z.string().max(3000).optional(),
    altText: z.string().max(180).optional(),
    sortOrder: z.number().int().nonnegative().default(0),
    isPrimaryCandidate: z.boolean().default(false)
  }),
  z.object({ action: z.literal("approve-draft"), draftId: z.string().uuid() }),
  z.object({ action: z.literal("reject-draft"), draftId: z.string().uuid(), reason: z.string().max(500).optional() }),
  z.object({ action: z.literal("archive-draft"), draftId: z.string().uuid() }),
  z.object({ action: z.literal("publish-draft"), draftId: z.string().uuid() }),
  z.object({ action: z.literal("set-primary"), imageId: z.string().uuid() }),
  z.object({ action: z.literal("archive-image"), imageId: z.string().uuid() }),
  z.object({ action: z.literal("replace-image"), imageId: z.string().uuid(), storagePath: z.string().min(2), publicUrl: z.string().url().optional(), altText: z.string().max(180).optional() }),
  z.object({ action: z.literal("reorder-images"), productSlug: z.string().min(2).max(140), imageIds: z.array(z.string().uuid()).min(1) }),
  z.object({ action: z.literal("generate-image-prompt"), productSlug: z.string().min(2).max(140), notes: z.string().max(1000).optional() })
]);

export const aiStudioSchema = z.object({
  operation: z.enum(["description", "short_copy", "pairing", "category", "upsell", "image_prompt", "image_draft"]),
  productSlug: z.string().min(2).max(140),
  notes: z.string().max(1000).optional()
});

export const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["PENDING_CONFIRMATION", "ACCEPTED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]),
  note: z.string().max(500).optional()
});

export const commandDraftSchema = z.object({
  channel: z.enum(["whatsapp", "instagram"]),
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(2000),
  target: z.string().max(160).optional(),
  scheduledFor: z.string().datetime().optional()
});

export const codOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(2).max(120).optional(),
  customerPhone: z.string().min(6).max(32).optional(),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    productName: z.string().min(2).max(160),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative()
  })).min(1),
  notes: z.string().max(1000).optional()
});

const orderTransitions: Record<string, string[]> = {
  PLACED: ["PENDING_CONFIRMATION", "ACCEPTED", "PREPARING", "CANCELLED"],
  PENDING_CONFIRMATION: ["ACCEPTED", "PREPARING", "CANCELLED"],
  ACCEPTED: ["PREPARING", "READY", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  COMPLETED: [],
  CANCELLED: []
};

export function assertOrderTransition(from: string, to: string) {
  if (!orderTransitions[from]?.includes(to)) {
    throw new Error(`Invalid order transition: ${from} -> ${to}`);
  }
}

export async function createCodOrder(input: z.infer<typeof codOrderSchema>, authContext: PrismaAuthContext = SYSTEM_AUTH_CONTEXT) {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return withPrismaAuthContext(authContext, async (db) => {
    const order = await db.cafeOrder.create({
      data: {
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        status: "PENDING_CONFIRMATION",
        paymentState: "UNPAID",
        subtotal,
        total: subtotal,
        metadata: { paymentMethod: "COD", launchMode: "commercial", notes: input.notes },
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        },
        timeline: {
          create: { status: "PENDING_CONFIRMATION", message: "COD order created and waiting for Control Tower confirmation." }
        },
        payments: {
          create: {
            provider: "cod",
            status: "PENDING",
            amount: subtotal,
            currency: "OMR",
            idempotencyKey: `cod_${crypto.randomUUID()}`,
            metadata: { method: "Cash On Delivery", stripeIntentCreated: false }
          }
        }
      },
      include: { items: true, timeline: true, payments: true, customer: true }
    });
    return order;
  });
}

export async function runProductAiDraft(input: z.infer<typeof aiStudioSchema>, authContext: PrismaAuthContext) {
  const product = await withPrismaAuthContext(authContext, (db) =>
    db.catalogProduct.findUnique({ where: { slug: input.productSlug }, include: { category: true } })
  );
  if (!product) throw new Error("Product not found");
  const operation = input.operation === "image_draft" ? "image_prompt" : input.operation;
  const draft = await runAiDraft({
    operation,
    productSlug: product.slug,
    productName: product.name,
    category: product.category?.name,
    notes: input.notes
  });
  return { product, draft };
}

function envReady(keys: string[]) {
  const missing = keys.filter((key) => !process.env[key]);
  return { ready: missing.length === 0, missing };
}

export async function providerReadiness() {
  const [database, redis, queue] = await Promise.allSettled([databaseHealth(), redisHealth(), queueHealth()]);
  const openai = envReady(["OPENAI_API_KEY"]);
  const stripe = envReady(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]);
  const whatsapp = envReady(["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET"]);
  const instagram = envReady(["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"]);
  const sentry = envReady(["SENTRY_DSN"]);

  return [
    provider("PostgreSQL", database.status === "fulfilled", database.status === "fulfilled" ? database.value.status : "critical", []),
    provider("Redis", redis.status === "fulfilled", redis.status === "fulfilled" ? redis.value.status : "critical", []),
    provider("Queues", queue.status === "fulfilled", queue.status === "fulfilled" ? queue.value.status : "critical", []),
    provider("OpenAI", openai.ready, openai.ready ? "ready" : "blocked", openai.missing),
    provider("Stripe", stripe.ready && process.env.PAYMENT_STRIPE_ENABLED !== "false", process.env.PAYMENT_STRIPE_ENABLED === "false" ? "disabled-for-cod" : stripe.ready ? "ready" : "blocked", stripe.missing),
    provider("WhatsApp", whatsapp.ready, whatsapp.ready ? "ready" : "blocked", whatsapp.missing),
    provider("Instagram", instagram.ready, instagram.ready ? "ready" : "blocked", instagram.missing),
    provider("Sentry", sentry.ready, sentry.ready ? "ready" : "blocked", sentry.missing)
  ];
}

function provider(name: string, ready: boolean, health: string, missing: string[]) {
  return {
    name,
    health,
    readiness: ready ? "READY" : "BLOCKED",
    risk: ready ? "LOW" : "HIGH",
    lastValidation: new Date().toISOString(),
    certificationScore: ready ? 9.5 : 5,
    missingConfiguration: missing.map((key) => key.replace(/./g, "*"))
  };
}
