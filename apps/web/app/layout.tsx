import type { Metadata } from "next";
import { saloraRuntime } from "@salora/config";
import "./globals.css";

// A request-specific CSP nonce is applied by proxy.ts. Nonces require dynamic
// rendering so Next.js can attach the same value to framework scripts/styles.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(saloraRuntime.siteUrl),
  title: {
    default: "SALORA.CAFE | Taste the Harmony",
    template: "%s | SALORA.CAFE"
  },
  description: "اكتشف منيو سالورا في واجهة شاطئ الدهاريز: قهوة مختصة، ماتشا، مشروبات وحلويات تُحضّر بعناية في صلالة.",
  alternates: {
    canonical: saloraRuntime.siteUrl
  },
  openGraph: {
    title: "SALORA.CAFE — Taste the Harmony",
    description: "A premium coffee, matcha and dessert experience at Dahariz Beachfront, Salalah.",
    type: "website",
    url: saloraRuntime.siteUrl
  },
  twitter: {
    card: "summary_large_image",
    title: "SALORA.CAFE — Taste the Harmony",
    description: "Premium coffee, matcha and desserts in Salalah."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
