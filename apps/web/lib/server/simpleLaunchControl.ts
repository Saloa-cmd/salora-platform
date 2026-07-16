import { createControlTowerRepository, routeAiRequest, SYSTEM_AUTH_CONTEXT } from "@salora/backend";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { currentAuthPayload } from "@/lib/server/auth/http";
import { hasPermission } from "@/lib/server/auth/rbac";
import type { RoleName } from "@/lib/server/auth/types";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

const secretKeyPattern = /(secret|token|password|api[_-]?key|dsn|database_url|direct_url|private|credential|stripe|redis|openai|gemini|whatsapp)/i;

export function requestId(request: NextRequest) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

export function pagination(request: NextRequest, defaults: { limit?: number; maxLimit?: number } = {}) {
  const maxLimit = defaults.maxLimit ?? 100;
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? defaults.limit ?? maxLimit);
  const requestedOffset = Number(request.nextUrl.searchParams.get("offset") ?? 0);
  const take = Math.min(Math.max(Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : maxLimit, 1), maxLimit);
  const skip = Math.max(Number.isFinite(requestedOffset) ? Math.floor(requestedOffset) : 0, 0);
  return { take, skip };
}

export async function requireControlPermission(request: NextRequest, permission: string) {
  const payload = await currentAuthPayload(request);
  await enforceRateLimit(request, "controlTower", payload.sub);
  if (!hasPermission(payload.roles as RoleName[], permission)) {
    throw new Error("Forbidden");
  }
  return payload as { sub: string; email: string; roles: RoleName[] };
}

export async function parseBody<T>(request: NextRequest, schema: z.ZodType<T>) {
  const body = await request.json().catch(() => null);
  return schema.safeParse(body);
}

export async function writeActivity(
  params: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    requestId: string;
    metadata?: Record<string, unknown>;
  },
  repo?: any
) {
  const db = repo ?? await createControlTowerRepository(SYSTEM_AUTH_CONTEXT);
  await db.activityLogs.create({
    actorId: params.actorId,
    actorType: params.actorId ? "user" : "system",
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    requestId: params.requestId,
    metadata: params.metadata
  });
}

export async function writeAudit(
  params: {
    actorId?: string;
    action: "CREATE" | "UPDATE" | "ARCHIVE" | "RESTORE" | "APPROVE" | "REJECT";
    entityType: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
    requestId: string;
    reason?: string;
  },
  repo?: any
) {
  const db = repo ?? await createControlTowerRepository(SYSTEM_AUTH_CONTEXT);
  await db.auditLogs.create({
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    before: params.before,
    after: params.after,
    requestId: params.requestId,
    reason: params.reason
  });
}

export function assertNonSecretKey(key: string) {
  if (secretKeyPattern.test(key)) {
    throw new Error("Secret-like runtime configuration keys cannot be managed from Control Tower.");
  }
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export const productMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    slug: z.string().min(2).max(140),
    name: z.string().min(2).max(160),
    nameAr: z.string().min(2).max(160).optional(),
    nameEn: z.string().min(2).max(160).optional(),
    categorySlug: z.string().min(2).max(120).optional(),
    categoryName: z.string().min(2).max(120),
    description: z.string().max(2000).default(""),
    descriptionAr: z.string().max(2000).optional(),
    descriptionEn: z.string().max(2000).optional(),
    basePrice: z.number().nonnegative(),
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).default("ACTIVE"),
    tags: z.array(z.string()).default([])
  }),
  z.object({
    action: z.literal("update"),
    slug: z.string().min(2).max(140),
    name: z.string().min(2).max(160).optional(),
    nameAr: z.string().min(2).max(160).optional(),
    nameEn: z.string().min(2).max(160).optional(),
    description: z.string().max(2000).optional(),
    descriptionAr: z.string().max(2000).optional(),
    descriptionEn: z.string().max(2000).optional(),
    basePrice: z.number().nonnegative().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
    tags: z.array(z.string()).optional()
  }),
  z.object({ action: z.literal("archive"), slug: z.string().min(2).max(140) }),
  z.object({ action: z.literal("restore"), slug: z.string().min(2).max(140) }),
  z.object({ action: z.literal("status"), slug: z.string().min(2).max(140), status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]) }),
  z.object({ action: z.literal("price"), slug: z.string().min(2).max(140), basePrice: z.number().nonnegative() })
]).superRefine((value, ctx) => {
  if ((value.action === "create" || value.action === "update") && value.status === "ACTIVE" && !value.basePrice) {
    ctx.addIssue({ code: "custom", message: "Active products require an approved positive price." });
  }
  if (value.action === "price" && value.basePrice === 0) {
    ctx.addIssue({ code: "custom", message: "Use DRAFT status for products awaiting pricing." });
  }
});

const configurationChoiceSchema = z.object({
  name: z.string().min(1).max(120),
  priceDelta: z.number().min(-100).max(100).default(0),
  sku: z.string().max(80).optional()
});

export const productConfigurationSchema = z.object({
  productSlug: z.string().min(2).max(140),
  variants: z.array(configurationChoiceSchema).max(30).default([]),
  addons: z.array(z.object({ name: z.string().min(1).max(120), price: z.number().min(0).max(100) })).max(40).default([]),
  modifierGroups: z.array(z.object({
    name: z.string().min(1).max(120),
    required: z.boolean().default(false),
    options: z.array(z.object({ id: z.string().min(1).max(120), name: z.string().min(1).max(120), priceDelta: z.number().min(-100).max(100).default(0) })).min(1).max(30)
  })).max(20).default([])
});

export const categoryMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().min(2).max(120), slug: z.string().min(2).max(120).optional(), sortOrder: z.number().int().nonnegative().default(0) }),
  z.object({ action: z.literal("update"), slug: z.string().min(2).max(120), name: z.string().min(2).max(120).optional(), sortOrder: z.number().int().nonnegative().optional() })
]);

export const productImageMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), productSlug: z.string().min(2), publicUrl: z.string().url(), storagePath: z.string().min(2).optional(), altText: z.string().max(180).optional(), isPrimary: z.boolean().default(false) }),
  z.object({ action: z.literal("primary"), imageId: z.string().uuid() }),
  z.object({ action: z.literal("archive"), imageId: z.string().uuid() })
]);

export const promotionMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), slug: z.string().min(2).max(140), name: z.string().min(2).max(160), description: z.string().max(1000).optional(), status: z.enum(["DRAFT", "APPROVED", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"]).default("DRAFT"), priority: z.number().int().default(0), rules: z.record(z.string(), z.unknown()).default({}) }),
  z.object({ action: z.literal("status"), slug: z.string().min(2).max(140), status: z.enum(["DRAFT", "APPROVED", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"]) }),
  z.object({ action: z.literal("expire"), slug: z.string().min(2).max(140) })
]);

export const couponMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), code: z.string().min(2).max(80), name: z.string().min(2).max(140), description: z.string().max(1000).optional(), discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_ITEM"]), discountValue: z.number().positive(), maxDiscountAmount: z.number().positive().optional(), minimumOrderTotal: z.number().nonnegative().optional() }),
  z.object({ action: z.literal("toggle"), code: z.string().min(2).max(80), isActive: z.boolean() })
]).superRefine((value, ctx) => {
  if (value.action === "create" && value.discountType === "PERCENTAGE" && value.discountValue > 25) {
    ctx.addIssue({ code: "custom", message: "Percentage discounts above 25% require a separate approval phase." });
  }
});

export const featureFlagMutationSchema = z.object({
  key: z.string().min(2).max(140),
  environment: z.string().min(2).max(40).default("staging"),
  enabled: z.boolean()
});

export const runtimeConfigMutationSchema = z.object({
  scope: z.enum(["PRICING", "PROMOTIONS", "PAYMENTS", "LOYALTY", "AI_ROUTING", "AI_PROVIDER", "WHATSAPP", "INSTAGRAM", "PROVIDERS", "NOTIFICATIONS", "FEATURE_FLAGS", "HOMEPAGE", "APP", "RECOMMENDATIONS", "OBSERVABILITY"]),
  key: z.string().min(2).max(140),
  value: z.record(z.string(), z.unknown()),
  isActive: z.boolean().default(true)
});

export const aiProductToolSchema = z.object({
  operation: z.enum(["description", "short_copy", "pairing", "category", "upsell", "image_prompt"]),
  productSlug: z.string().min(2).max(140).optional(),
  productName: z.string().min(2).max(160),
  category: z.string().max(120).optional(),
  notes: z.string().max(1000).optional()
});

export async function handleError(error: unknown, id: string) {
  const limited = rateLimitResponse(error, id);
  if (limited) return limited;
  if (error instanceof Error && error.message === "Missing bearer token.") return responseError("Unauthorized.", id, 401);
  if (error instanceof Error && error.message === "Forbidden") return responseError("Forbidden.", id, 403);
  if (error instanceof Error && error.message.includes("Secret-like")) return responseError(error.message, id, 400);
  return responseError("Control Tower request failed safely.", id, 500);
}

export async function runAiDraft(input: z.infer<typeof aiProductToolSchema>) {
  const instruction = {
    description: "Generate a reviewable product description draft. Do not publish it.",
    short_copy: "Generate short menu copy draft under 18 words. Do not publish it.",
    pairing: "Suggest one pairing from a cafe menu perspective. Do not publish it.",
    category: "Suggest the best product category. Do not publish it.",
    upsell: "Suggest a modest upsell. Do not publish it.",
    image_prompt: "Generate an image prompt only. Do not generate an image or URL."
  }[input.operation];

  return routeAiRequest({
    message: `${instruction}\nProduct: ${input.productName}\nCategory: ${input.category ?? "unknown"}\nNotes: ${input.notes ?? ""}`,
    intent: input.operation === "pairing" ? "suggest_pairings" : "explain_product",
    channel: "web",
    locale: "en",
    context: {
      channel: "web",
      products: [{ slug: input.productSlug, name: input.productName, category: input.category, draftOnly: true }]
    }
  });
}
