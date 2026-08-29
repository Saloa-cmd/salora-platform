import { redisHealth } from "@salora/backend/cache/health";
import { databaseHealth } from "@salora/backend/database/health";
import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext, type PrismaAuthContext } from "@salora/backend/database/rls-context";
import { queueHealth } from "@salora/backend/jobs/health/health";
import { z } from "zod";
import { runAiDraft } from "./simpleLaunchControl";
import {
  catalogProductIsAvailable,
  currentCatalogPrice,
  decimalNumber,
  money,
  normalizeCatalogModifierOptions,
  type CatalogModifierOption
} from "./commerceIntegrity";

export const mediaMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create-draft"),
    productSlug: z.string().min(2).max(140),
    source: z.enum(["manual", "upload", "ai_image", "ai_prompt"]).default("manual"),
    storageBucket: z.string().regex(/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/).optional(),
    storagePath: z.string().min(2).max(500).optional(),
    publicUrl: z.string().url().optional(),
    mimeType: z.enum(["image/webp", "image/avif"]).optional(),
    width: z.number().int().min(320).max(8000).optional(),
    height: z.number().int().min(320).max(8000).optional(),
    fileSize: z.number().int().positive().max(10 * 1024 * 1024).optional(),
    checksum: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    altTextAr: z.string().min(2).max(180).optional(),
    altTextEn: z.string().min(2).max(180).optional(),
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
  z.object({ action: z.literal("replace-image"), imageId: z.string().uuid(), storageBucket: z.string().regex(/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/), storagePath: z.string().min(2).max(500), publicUrl: z.string().url(), mimeType: z.enum(["image/webp", "image/avif"]), width: z.number().int().min(320).max(8000), height: z.number().int().min(320).max(8000), fileSize: z.number().int().positive().max(10 * 1024 * 1024), checksum: z.string().regex(/^[a-f0-9]{64}$/), altTextAr: z.string().min(2).max(180), altTextEn: z.string().min(2).max(180) }),
  z.object({ action: z.literal("reorder-images"), productSlug: z.string().min(2).max(140), imageIds: z.array(z.string().uuid()).min(1) }),
  z.object({ action: z.literal("generate-image-prompt"), productSlug: z.string().min(2).max(140), notes: z.string().max(1000).optional() })
]).superRefine((value, ctx) => {
  if (value.action !== "create-draft" || (!value.storagePath && !value.publicUrl)) return;
  for (const key of ["storageBucket", "storagePath", "publicUrl", "mimeType", "width", "height", "fileSize", "checksum", "altTextAr", "altTextEn"] as const) {
    if (value[key] == null) ctx.addIssue({ code: "custom", path: [key], message: "Certified media metadata is required for stored assets." });
  }
  if (value.storagePath && (value.storagePath.startsWith("/") || value.storagePath.includes("..") || value.storagePath.includes("\\"))) {
    ctx.addIssue({ code: "custom", path: ["storagePath"], message: "Unsafe storage path." });
  }
});

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
    productSlug: z.string().min(2).max(140),
    quantity: z.number().int().positive().max(25),
    modifiers: z.array(z.object({
      groupId: z.string().min(1).max(120),
      optionId: z.string().min(1).max(120),
      groupName: z.string().min(1).max(120).optional(),
      optionName: z.string().min(1).max(120).optional(),
      priceDelta: z.number().min(-100).max(100).optional()
    })).max(20).optional()
  })).min(1).max(50),
  notes: z.string().max(1000).optional()
});

export class OrderIntegrityError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
    this.name = "OrderIntegrityError";
  }
}

type AuthoritativeSelection = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
};

const fallbackModifierGroups: Record<string, { name: string; required: boolean; options: Record<string, CatalogModifierOption> }> = {
  size: {
    name: "Size",
    required: true,
    options: {
      regular: { id: "regular", name: "Regular", priceDelta: 0 },
      large: { id: "large", name: "Large", priceDelta: 0.3 }
    }
  },
  milk: {
    name: "Milk",
    required: true,
    options: {
      regular: { id: "regular", name: "Regular", priceDelta: 0 },
      oat: { id: "oat", name: "Oat", priceDelta: 0.25 },
      almond: { id: "almond", name: "Almond", priceDelta: 0.25 }
    }
  },
  sugar: {
    name: "Sugar",
    required: true,
    options: {
      none: { id: "none", name: "None", priceDelta: 0 },
      less: { id: "less", name: "Less", priceDelta: 0 },
      regular: { id: "regular", name: "Regular", priceDelta: 0 }
    }
  },
  ice: {
    name: "Ice",
    required: true,
    options: {
      none: { id: "none", name: "None", priceDelta: 0 },
      light: { id: "light", name: "Light", priceDelta: 0 },
      regular: { id: "regular", name: "Regular", priceDelta: 0 }
    }
  }
};

function assertUniqueSelections(selections: Array<{ groupId: string; optionId: string }>) {
  const groups = new Set<string>();
  for (const selection of selections) {
    if (groups.has(selection.groupId)) {
      throw new OrderIntegrityError("Each option group can only be selected once.", 400);
    }
    groups.add(selection.groupId);
  }
}

function resolveSelections(
  selections: Array<{ groupId: string; optionId: string }>,
  product: {
    variants: Array<{ id: string; name: string; priceDelta: { toString(): string } | number | string }>;
    addons: Array<{ id: string; name: string; price: { toString(): string } | number | string }>;
    modifiers: Array<{ id: string; name: string; required: boolean; options: unknown }>;
  }
): AuthoritativeSelection[] {
  assertUniqueSelections(selections);
  const hasDatabaseGroups = product.variants.length > 0 || product.addons.length > 0 || product.modifiers.length > 0;
  const resolved = selections.map((selection) => {
    if (selection.groupId === "variant") {
      const option = product.variants.find((variant) => variant.id === selection.optionId);
      if (!option) throw new OrderIntegrityError("The selected product variant is no longer available.");
      return { groupId: "variant", groupName: "Variant", optionId: option.id, optionName: option.name, priceDelta: decimalNumber(option.priceDelta) };
    }
    if (selection.groupId === "addons") {
      const option = product.addons.find((addon) => addon.id === selection.optionId);
      if (!option) throw new OrderIntegrityError("The selected add-on is no longer available.");
      return { groupId: "addons", groupName: "Add-ons", optionId: option.id, optionName: option.name, priceDelta: decimalNumber(option.price) };
    }
    const group = product.modifiers.find((modifier) => modifier.id === selection.groupId);
    if (group) {
      const option = normalizeCatalogModifierOptions(group.options).find((candidate) => candidate.id === selection.optionId);
      if (!option) throw new OrderIntegrityError("The selected product option is no longer available.");
      return { groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, priceDelta: option.priceDelta };
    }
    if (!hasDatabaseGroups) {
      const fallbackGroup = fallbackModifierGroups[selection.groupId];
      const option = fallbackGroup?.options[selection.optionId];
      if (fallbackGroup && option) {
        return { groupId: selection.groupId, groupName: fallbackGroup.name, optionId: option.id, optionName: option.name, priceDelta: option.priceDelta };
      }
    }
    throw new OrderIntegrityError("The selected product option is not recognized.");
  });

  if (product.variants.length > 0 && !resolved.some((selection) => selection.groupId === "variant")) {
    throw new OrderIntegrityError("A product variant must be selected.", 400);
  }
  for (const group of product.modifiers.filter((modifier) => modifier.required)) {
    if (!resolved.some((selection) => selection.groupId === group.id)) {
      throw new OrderIntegrityError(`A required option is missing for ${group.name}.`, 400);
    }
  }
  return resolved;
}

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
  return withPrismaAuthContext(authContext, async (db) => {
    const productSlugs = [...new Set(input.items.map((item) => item.productSlug))];
    const products = await db.catalogProduct.findMany({
      where: { brandKey: "SALORA", status: "ACTIVE", slug: { in: productSlugs } },
      include: {
        variants: true,
        addons: true,
        modifiers: true,
        pricingRules: true,
        availabilityRules: true
      }
    });
    if (products.length !== productSlugs.length) {
      throw new OrderIntegrityError("One or more products are unavailable.");
    }

    const now = new Date();
    const productsBySlug = new Map(products.map((product) => [product.slug, product]));
    const authoritativeItems = input.items.map((item) => {
      const product = productsBySlug.get(item.productSlug);
      if (!product || !catalogProductIsAvailable(product.availabilityRules, now)) {
        throw new OrderIntegrityError("One or more products are currently unavailable.");
      }
      const modifiers = resolveSelections(item.modifiers ?? [], product);
      const basePrice = currentCatalogPrice(product.basePrice, product.pricingRules, now);
      const unitPrice = money(basePrice + modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0));
      if (unitPrice < 0) throw new OrderIntegrityError("The authoritative product price is invalid.");
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: money(item.quantity * unitPrice),
        modifiers
      };
    });
    const subtotal = money(authoritativeItems.reduce((sum, item) => sum + item.totalPrice, 0));
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
          create: authoritativeItems
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
