import { z } from "zod";

export const MAX_ANALYTICS_BODY_BYTES = 4_096;
export const MAX_ANALYTICS_METADATA_KEYS = 5;

const analyticsMetadataSchema = z.object({
  locale: z.enum(["ar", "en"]).optional(),
  placement: z.string().trim().min(1).max(80).optional(),
  experimentKey: z.string().trim().min(1).max(80).optional(),
  variant: z.string().trim().min(1).max(80).optional(),
  source: z.string().trim().min(1).max(80).optional()
}).strict().superRefine((metadata, context) => {
  if (Object.keys(metadata).length > MAX_ANALYTICS_METADATA_KEYS) {
    context.addIssue({ code: "custom", message: "Analytics metadata has too many keys." });
  }
});

const menuAnalyticsEventSchema = z.object({
  eventType: z.enum(["view", "click", "search", "favorite", "ai_recommendation"]),
  revisionId: z.string().uuid(),
  productSlug: z.string().trim().min(1).max(140).optional(),
  query: z.string().trim().max(200).optional(),
  channel: z.enum(["web", "mobile", "qr", "ai"]).default("web"),
  metadata: analyticsMetadataSchema.optional()
}).strict();

export function parseMenuAnalyticsEvent(rawBody: string) {
  if (new TextEncoder().encode(rawBody).byteLength > MAX_ANALYTICS_BODY_BYTES) {
    return { success: false as const, reason: "payload_too_large" as const };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { success: false as const, reason: "invalid_json" as const };
  }

  const parsed = menuAnalyticsEventSchema.safeParse(payload);
  if (!parsed.success) return { success: false as const, reason: "invalid_payload" as const };
  return { success: true as const, data: parsed.data };
}
