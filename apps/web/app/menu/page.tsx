import type { Metadata } from "next";
import { MenuExperience } from "@/components/menu/MenuExperience";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";
import { saloraRuntime } from "@salora/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SALORA Menu | Taste the Harmony",
  description: "Explore the SALORA menu, customize your order, and choose counter or beachfront pickup."
};

export default async function MenuPage() {
  const snapshot = await getPublicMenuSnapshot();

  return (
    <MenuExperience
      initialProducts={snapshot.products}
      menuSource={snapshot.source}
      menuStale={snapshot.stale}
      whatsappNumber={saloraRuntime.whatsappNumber}
    />
  );
}
