import type { ExperienceConfiguration, ExperiencePageV2, ExperienceResponsiveSettings } from "@salora/types";
import { parseExperiencePageV2 } from "./schema-v2";

const defaultResponsive: ExperienceResponsiveSettings = { width: "wide", spacing: "lg", alignment: "start", surface: "background" };

/**
 * Read-only compatibility bridge. It does not publish, mutate data, or change Menu Authority.
 * Existing ExperienceConfiguration v1 remains the production contract until the governed workflow is activated.
 */
export function adaptExperienceConfigurationV1(configuration: ExperienceConfiguration, pageId: string): ExperiencePageV2 {
  return parseExperiencePageV2({
    schemaVersion: 2,
    brandKey: "SALORA",
    id: pageId,
    slug: "/",
    version: 1,
    status: "DRAFT",
    title: { ar: "الصفحة الرئيسية", en: "Homepage" },
    defaultTheme: "dark",
    sections: [
      {
        id: "homepage-hero", componentId: "hero.luxury.v1", componentVersion: 1, variant: "split", visible: true,
        responsive: { ...defaultResponsive, width: "full", surface: "hero" },
        content: {
          title: { ar: configuration.site.heroTitleAr, en: configuration.site.heroTitleEn },
          subtitle: { ar: configuration.site.heroSubtitleAr, en: configuration.site.heroSubtitleEn },
          primaryAction: { label: { ar: "اكتشف المنيو", en: "Explore the menu" }, destination: "/menu" }
        }
      },
      {
        id: "homepage-products", componentId: "menu.product-grid.premium.v1", componentVersion: 1, variant: configuration.menu.layout, visible: true,
        responsive: defaultResponsive,
        content: { heading: { ar: "مختارات سالورا", en: "SALORA selections" }, source: "menu-authority-adapter", featuredOnly: true, maxItems: Math.min(configuration.menu.columns * 2, 8) }
      },
      {
        id: "homepage-location", componentId: "location.map-card.v1", componentVersion: 1, variant: "split", visible: true,
        responsive: { ...defaultResponsive, surface: "elevated" },
        content: {
          heading: { ar: "واجهة شاطئ الدهاريز", en: "Dahariz Beachfront" }, address: { ar: "صلالة، سلطنة عُمان", en: "Salalah, Oman" },
          hours: { ar: "يوميًا · 4 مساءً — 2 صباحًا", en: "Daily · 4 PM — 2 AM" }, latitude: 17.011517, longitude: 54.174511,
          action: { label: { ar: "الاتجاهات", en: "Directions" }, destination: "https://maps.google.com/?q=17.011517,54.174511", external: true, icon: "location" }
        }
      }
    ]
  });
}

export function sectionsForPlatform(page: ExperiencePageV2, platform: "web" | "mobile" | "digital-menu") {
  const override = page.platformOverrides?.[platform];
  const hidden = new Set(override?.hiddenSectionIds ?? []);
  const visible = page.sections.filter((section) => section.visible && !section.responsive.hiddenOn?.includes(platform) && !hidden.has(section.id));
  if (!override?.sectionOrder?.length) return visible;
  const order = new Map(override.sectionOrder.map((id, index) => [id, index]));
  return [...visible].sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}
