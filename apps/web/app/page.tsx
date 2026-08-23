import type { Product } from "@salora/types";
import { PremiumHomeExperience } from "@/components/home/PremiumHomeExperience";
import { getPublishedExperienceConfiguration } from "@/lib/server/experienceConfig";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";
import { saloraRuntime } from "@salora/config";

export const dynamic = "force-dynamic";

function selectHomepageProducts(products: Product[]) {
  const selected: Product[] = [];
  const seenSections = new Set<string>();

  for (const product of products.filter((item) => item.featured)) {
    if (selected.length === 6) break;
    selected.push(product);
    if (product.sectionKey) seenSections.add(product.sectionKey);
  }

  for (const product of products) {
    if (selected.length === 6) break;
    const section = product.sectionKey ?? product.category;
    if (selected.some((item) => item.id === product.id) || seenSections.has(section)) continue;
    selected.push(product);
    seenSections.add(section);
  }

  for (const product of products) {
    if (selected.length === 6) break;
    if (!selected.some((item) => item.id === product.id)) selected.push(product);
  }

  return selected;
}

export default async function HomePage() {
  const [menuSnapshot, experience] = await Promise.all([
    getPublicMenuSnapshot(),
    getPublishedExperienceConfiguration()
  ]);

  return (
    <PremiumHomeExperience
      featuredProducts={selectHomepageProducts(menuSnapshot.products)}
      menuSource={menuSnapshot.source}
      menuStale={menuSnapshot.stale}
      whatsappNumber={saloraRuntime.whatsappNumber}
      experience={experience}
    />
  );
}
