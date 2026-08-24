import { z } from "zod";
import type { ExperienceConfiguration } from "@salora/types";

const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const safeUrl = z.union([z.literal(""), z.string().url().refine((value) => value.startsWith("https://"), "HTTPS is required")]);
const safeLink = z.union([z.literal(""), z.string().regex(/^\/(?!\/)[^\s]*$/), safeUrl]);

const CUSTOMER_HERO_SUBTITLE_AR = "قهوة مختصة، ماتشا، مشروبات منعشة وحلويات تُحضّر بعناية للحظات تستحق أن تُعاش.";
const CUSTOMER_HERO_SUBTITLE_EN = "Specialty coffee, matcha, refreshing drinks and desserts, prepared with care for moments worth enjoying.";
const LEGACY_TECHNICAL_SUBTITLES = new Set([
  "منيو متصل مباشرة بمنصة SALORA، قابل للتخصيص والاستلام من الكاونتر أو أمام البحر.",
  "A customizable menu connected to SALORA, ready for counter or beachfront pickup."
]);

export const experienceConfigurationSchema: z.ZodType<ExperienceConfiguration> = z.object({
  schemaVersion: z.literal(1),
  brandKey: z.literal("SALORA"),
  theme: z.object({
    primaryColor: color,
    backgroundColor: color,
    surfaceColor: color,
    textColor: color,
    mutedColor: color,
    borderRadius: z.number().int().min(0).max(40),
    fontFamily: z.enum(["sans", "serif", "modern"])
  }),
  menu: z.object({
    layout: z.enum(["grid", "list", "editorial"]),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    cardRatio: z.enum(["landscape", "square", "portrait"]),
    showImages: z.boolean(),
    showDescriptions: z.boolean(),
    showSearch: z.boolean(),
    showCategories: z.boolean()
  }),
  site: z.object({
    logoUrl: safeUrl,
    heroTitleAr: z.string().min(2).max(160),
    heroTitleEn: z.string().min(2).max(160),
    heroSubtitleAr: z.string().max(400),
    heroSubtitleEn: z.string().max(400),
    announcementAr: z.string().max(240),
    announcementEn: z.string().max(240),
    showAnnouncement: z.boolean()
  }),
  app: z.object({
    compactCards: z.boolean(),
    showOrdering: z.boolean(),
    showRecommendations: z.boolean(),
    navigationStyle: z.enum(["tabs", "cards"])
  }),
  banners: z.array(z.object({
    id: z.string().min(1).max(80),
    titleAr: z.string().max(160),
    titleEn: z.string().max(160),
    subtitleAr: z.string().max(300),
    subtitleEn: z.string().max(300),
    imageUrl: safeUrl,
    linkUrl: safeLink,
    placement: z.enum(["home", "menu", "both"]),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(999)
  })).max(20)
});

export const defaultExperienceConfiguration: ExperienceConfiguration = {
  schemaVersion: 1,
  brandKey: "SALORA",
  theme: { primaryColor: "#C9A45C", backgroundColor: "#050505", surfaceColor: "#15110F", textColor: "#F5EFE3", mutedColor: "#9C9387", borderRadius: 24, fontFamily: "sans" },
  menu: { layout: "grid", columns: 3, cardRatio: "landscape", showImages: true, showDescriptions: true, showSearch: true, showCategories: true },
  site: {
    logoUrl: "",
    heroTitleAr: "اختر لحظتك، ونحن نحضّر الانسجام.",
    heroTitleEn: "Choose your moment. We prepare the harmony.",
    heroSubtitleAr: CUSTOMER_HERO_SUBTITLE_AR,
    heroSubtitleEn: CUSTOMER_HERO_SUBTITLE_EN,
    announcementAr: "أهلًا بكم في سالورا",
    announcementEn: "Welcome to SALORA",
    showAnnouncement: false
  },
  app: { compactCards: false, showOrdering: true, showRecommendations: true, navigationStyle: "tabs" },
  banners: []
};

function customerFacingConfiguration(configuration: ExperienceConfiguration): ExperienceConfiguration {
  const heroSubtitleAr = LEGACY_TECHNICAL_SUBTITLES.has(configuration.site.heroSubtitleAr)
    ? CUSTOMER_HERO_SUBTITLE_AR
    : configuration.site.heroSubtitleAr;
  const heroSubtitleEn = LEGACY_TECHNICAL_SUBTITLES.has(configuration.site.heroSubtitleEn)
    ? CUSTOMER_HERO_SUBTITLE_EN
    : configuration.site.heroSubtitleEn;

  if (heroSubtitleAr === configuration.site.heroSubtitleAr && heroSubtitleEn === configuration.site.heroSubtitleEn) {
    return configuration;
  }

  return {
    ...configuration,
    site: {
      ...configuration.site,
      heroSubtitleAr,
      heroSubtitleEn
    }
  };
}

export function parseExperienceConfiguration(value: unknown): ExperienceConfiguration {
  const parsed = experienceConfigurationSchema.safeParse(value);
  return customerFacingConfiguration(parsed.success ? parsed.data : defaultExperienceConfiguration);
}

export const EXPERIENCE_DRAFT_KEY = "salora_experience_draft";
export const EXPERIENCE_PUBLISHED_KEY = "salora_experience_published";
