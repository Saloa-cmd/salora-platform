import type { Metadata } from "next";
import { MenuExperience } from "@/components/menu/MenuExperience";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";
import { saloraRuntime } from "@salora/config";
import { getPublishedExperienceConfiguration } from "@/lib/server/experienceConfig";
import { buildMenuReadModel } from "@/lib/server/menuReadModel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SALORA Menu | Taste the Harmony",
  description: "Explore the current published SALORA menu revision, customize your order, and choose counter or beachfront pickup."
};

type MenuSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MenuPage({ searchParams }: { searchParams: MenuSearchParams }) {
  const resolvedSearchParams = await searchParams;
  const [snapshot, experience] = await Promise.all([
    getPublicMenuSnapshot(),
    getPublishedExperienceConfiguration()
  ]);
  const menu = buildMenuReadModel(snapshot, {
    category: firstSearchParam(resolvedSearchParams.category),
    query: firstSearchParam(resolvedSearchParams.q),
    limit: firstSearchParam(resolvedSearchParams.limit)
  });

  return (
    <MenuExperience
      initialProducts={menu.products}
      categories={menu.categories}
      selectedCategory={menu.selectedCategory}
      initialSearch={menu.query}
      resultTotal={menu.resultTotal}
      resultLimit={menu.resultLimit}
      hasMore={menu.hasMore}
      searchAvailable={menu.searchAvailable}
      totalCatalogProducts={menu.totalCatalogProducts}
      revision={snapshot.revision}
      menuSource={snapshot.source}
      menuStale={snapshot.stale}
      menuDatabaseHealth={snapshot.databaseHealth}
      whatsappNumber={saloraRuntime.whatsappNumber}
      experience={experience}
    />
  );
}
