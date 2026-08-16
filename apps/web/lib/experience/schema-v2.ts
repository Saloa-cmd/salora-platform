import { z } from "zod";
import type { ExperiencePageV2 } from "@salora/types";

const localizedText = z.object({ ar: z.string().trim().min(1).max(500), en: z.string().trim().min(1).max(500) }).strict();
const internalDestination = z.string().regex(/^\/(?!\/)[^\s]*$/);
const httpsDestination = z.string().url().refine((value) => value.startsWith("https://"), "Only HTTPS external links are allowed");
const safeDestination = z.union([internalDestination, httpsDestination]);
const iconName = z.enum(["ai", "analytics", "assets", "back", "bell", "brand", "car", "cart", "check", "close", "coffee", "dashboard", "dineIn", "forward", "gift", "history", "language", "location", "menu", "mobile", "navigation", "orders", "pages", "preview", "publish", "revision", "search", "settings", "sparkles", "store", "theme", "user", "whatsapp"]);
const action = z.object({ label: localizedText, destination: safeDestination, icon: iconName.optional(), external: z.boolean().optional() }).strict().superRefine((value, context) => {
  const isExternal = value.destination.startsWith("https://");
  if (Boolean(value.external) !== isExternal) context.addIssue({ code: "custom", message: "external must match the destination type" });
});
const responsive = z.object({
  hiddenOn: z.array(z.enum(["web", "mobile", "digital-menu"])).max(3).optional(),
  width: z.enum(["full", "wide", "content", "compact"]),
  spacing: z.enum(["none", "xs", "sm", "md", "lg", "xl"]),
  alignment: z.enum(["start", "center", "end"]),
  surface: z.enum(["background", "surface", "elevated", "brand", "hero"])
}).strict();
const base = { id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/), componentVersion: z.literal(1), visible: z.boolean(), responsive };

const section = z.discriminatedUnion("componentId", [
  z.object({ ...base, componentId: z.literal("hero.luxury.v1"), variant: z.enum(["split", "editorial"]), content: z.object({ title: localizedText, subtitle: localizedText, imageAssetId: z.string().uuid().optional(), primaryAction: action, secondaryAction: action.optional() }).strict() }).strict(),
  z.object({ ...base, componentId: z.literal("menu.product-grid.premium.v1"), variant: z.enum(["grid", "editorial", "list"]), content: z.object({ heading: localizedText, description: localizedText.optional(), source: z.literal("menu-authority-adapter"), categoryKey: z.string().regex(/^[a-z0-9-]+$/).max(80).optional(), featuredOnly: z.boolean(), maxItems: z.number().int().min(1).max(24) }).strict() }).strict(),
  z.object({ ...base, componentId: z.literal("story.editorial.v1"), variant: z.enum(["image-start", "image-end", "text-only"]), content: z.object({ heading: localizedText, body: localizedText, imageAssetId: z.string().uuid().optional(), action: action.optional() }).strict() }).strict(),
  z.object({ ...base, componentId: z.literal("location.map-card.v1"), variant: z.enum(["split", "compact"]), content: z.object({ heading: localizedText, address: localizedText, hours: localizedText, latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), action }).strict() }).strict(),
  z.object({ ...base, componentId: z.literal("cta.gold.v1"), variant: z.enum(["solid", "outline"]), content: z.object({ heading: localizedText, body: localizedText.optional(), action }).strict() }).strict()
]);

const platformOverride = z.object({ hiddenSectionIds: z.array(z.string()).optional(), sectionOrder: z.array(z.string()).optional() }).strict();

export const experiencePageV2Schema: z.ZodType<ExperiencePageV2> = z.object({
  schemaVersion: z.literal(2),
  brandKey: z.literal("SALORA"),
  id: z.string().uuid(),
  slug: z.string().regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/),
  version: z.number().int().positive(),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "SUPERSEDED"]),
  title: localizedText,
  defaultTheme: z.enum(["dark", "light", "system"]),
  sections: z.array(section).min(1).max(40),
  platformOverrides: z.object({ web: platformOverride.optional(), mobile: platformOverride.optional(), "digital-menu": platformOverride.optional() }).strict().optional()
}).strict().superRefine((page, context) => {
  const ids = page.sections.map((item) => item.id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "Section IDs must be unique", path: ["sections"] });
  for (const [platform, override] of Object.entries(page.platformOverrides ?? {})) {
    for (const id of [...(override.hiddenSectionIds ?? []), ...(override.sectionOrder ?? [])]) {
      if (!ids.includes(id)) context.addIssue({ code: "custom", message: `Unknown section ${id} in ${platform} override`, path: ["platformOverrides", platform] });
    }
  }
});

export function parseExperiencePageV2(value: unknown): ExperiencePageV2 {
  return experiencePageV2Schema.parse(value);
}
