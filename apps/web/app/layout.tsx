import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { saloraRuntime } from "@salora/config";
import type { ThemePreference } from "@salora/ui";
import { isThemePreference, themeBootstrapScript } from "@/lib/theme";
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const stored = cookieStore.get("salora_theme")?.value;
  const preference: ThemePreference = isThemePreference(stored) ? stored : "system";
  const nonce = headerStore.get("x-nonce") ?? undefined;
  const initialTheme = preference === "light" ? "light" : "dark";
  return (
    <html lang="ar" dir="rtl" data-theme={initialTheme} data-theme-preference={preference} suppressHydrationWarning>
      <head><script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
