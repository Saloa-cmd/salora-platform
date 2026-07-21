import type { Metadata } from "next";
import { MenuExperience } from "@/components/menu/MenuExperience";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";
import { saloraRuntime } from "@salora/config";
import { getPublishedExperienceConfiguration } from "@/lib/server/experienceConfig";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SALORA Menu | Taste the Harmony",
  description: "Explore the SALORA menu, customize your order, and choose counter or beachfront pickup."
};

export default async function MenuPage() {
  const [snapshot, experience] = await Promise.all([getPublicMenuSnapshot(), getPublishedExperienceConfiguration()]);

  return (
    <MenuExperience
      initialProducts={snapshot.products}
      menuSource={snapshot.source}
      menuStale={snapshot.stale}
      whatsappNumber={saloraRuntime.whatsappNumber}
      experience={experience}
    />
  );
}
