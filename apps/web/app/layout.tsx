import type { Metadata } from "next";
import { saloraRuntime } from "@salora/config";
import "./globals.css";

// A request-specific CSP nonce is applied by proxy.ts. Nonces require dynamic
// rendering so Next.js can attach the same value to framework scripts/styles.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(saloraRuntime.siteUrl),
  title: "SALORA / Salora.Cafe",
  description: "A premium AI-powered cafe platform foundation for matcha, specialty coffee, desserts, and effortless ordering.",
  openGraph: {
    title: "SALORA - Where Taste Meets Intelligence",
    description: "Cinematic AI cafe experience for ordering, recommendations, loyalty, and future hospitality intelligence.",
    type: "website",
    url: saloraRuntime.siteUrl
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
