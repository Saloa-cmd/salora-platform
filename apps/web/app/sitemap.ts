import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SALORA_SITE_URL || "https://salora.cafe";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date("2026-05-31"),
      changeFrequency: "weekly",
      priority: 1
    }
  ];
}
