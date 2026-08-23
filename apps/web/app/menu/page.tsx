import type { Metadata } from "next";
import { MenuExperience } from "@/components/menu/MenuExperience";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";
import { saloraRuntime } from "@salora/config";
import { getPublishedExperienceConfiguration } from "@/lib/server/experienceConfig";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SALORA Menu | Taste the Harmony",
  description: "Explore the current published SALORA menu revision, customize your order, and choose counter or beachfront pickup."
};

export default async function MenuPage() {
  // Both reads open an RLS-scoped Prisma transaction. Keep them sequential so
  // a transaction-bound pg client never receives overlapping query() calls.
  const snapshot = await getPublicMenuSnapshot();
  const experience = await getPublishedExperienceConfiguration();

  return (
    <MenuExperience
      initialProducts={snapshot.products}
      sections={snapshot.sections}
      revision={snapshot.revision}
      menuSource={snapshot.source}
      menuStale={snapshot.stale}
      whatsappNumber={saloraRuntime.whatsappNumber}
      experience={experience}
    />
  );
}
