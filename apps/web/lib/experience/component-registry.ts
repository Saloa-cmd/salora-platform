import type { ExperiencePlatform, ExperienceSectionV2 } from "@salora/types";

export type ExperienceComponentId = ExperienceSectionV2["componentId"];

export interface ExperienceComponentDefinition {
  id: ExperienceComponentId;
  displayName: { ar: string; en: string };
  category: "hero" | "menu" | "content" | "location" | "action";
  supportedPlatforms: readonly ExperiencePlatform[];
  variants: readonly string[];
  allowedProperties: readonly string[];
  requiredData: readonly string[];
  accessibilityRules: readonly string[];
  themeSupport: readonly ["dark", "light", "system"];
  version: 1;
}

export const SALORA_COMPONENT_REGISTRY = {
  "hero.luxury.v1": {
    id: "hero.luxury.v1", displayName: { ar: "واجهة فاخرة", en: "Luxury hero" }, category: "hero",
    supportedPlatforms: ["web", "mobile", "digital-menu"], variants: ["split", "editorial"],
    allowedProperties: ["title", "subtitle", "imageAssetId", "primaryAction", "secondaryAction"], requiredData: [],
    accessibilityRules: ["Exactly one page-level heading", "Actions require localized accessible labels", "Media requires governed bilingual alt text"],
    themeSupport: ["dark", "light", "system"], version: 1
  },
  "menu.product-grid.premium.v1": {
    id: "menu.product-grid.premium.v1", displayName: { ar: "شبكة منتجات سالورا", en: "SALORA product grid" }, category: "menu",
    supportedPlatforms: ["web", "mobile", "digital-menu"], variants: ["grid", "editorial", "list"],
    allowedProperties: ["heading", "description", "categoryKey", "featuredOnly", "maxItems"], requiredData: ["menu-authority-adapter"],
    accessibilityRules: ["Product state comes from data authority", "Keyboard navigation must match visual order", "Prices include currency"],
    themeSupport: ["dark", "light", "system"], version: 1
  },
  "story.editorial.v1": {
    id: "story.editorial.v1", displayName: { ar: "قصة تحريرية", en: "Editorial story" }, category: "content",
    supportedPlatforms: ["web", "mobile"], variants: ["image-start", "image-end", "text-only"],
    allowedProperties: ["heading", "body", "imageAssetId", "action"], requiredData: [],
    accessibilityRules: ["Heading level follows page outline", "Body language matches active locale", "Media requires governed bilingual alt text"],
    themeSupport: ["dark", "light", "system"], version: 1
  },
  "location.map-card.v1": {
    id: "location.map-card.v1", displayName: { ar: "بطاقة الموقع", en: "Location card" }, category: "location",
    supportedPlatforms: ["web", "mobile", "digital-menu"], variants: ["split", "compact"],
    allowedProperties: ["heading", "address", "hours", "latitude", "longitude", "action"], requiredData: [],
    accessibilityRules: ["Address remains available as text", "Map is supplementary", "Directions action has an accessible label"],
    themeSupport: ["dark", "light", "system"], version: 1
  },
  "cta.gold.v1": {
    id: "cta.gold.v1", displayName: { ar: "دعوة ذهبية", en: "Gold CTA" }, category: "action",
    supportedPlatforms: ["web", "mobile", "digital-menu"], variants: ["solid", "outline"],
    allowedProperties: ["heading", "body", "action"], requiredData: [],
    accessibilityRules: ["One unambiguous primary action", "Minimum 44px touch target", "AA contrast in every supported theme"],
    themeSupport: ["dark", "light", "system"], version: 1
  }
} as const satisfies Record<ExperienceComponentId, ExperienceComponentDefinition>;

export function getExperienceComponentDefinition(id: string): ExperienceComponentDefinition | undefined {
  return SALORA_COMPONENT_REGISTRY[id as ExperienceComponentId];
}
