export const saloraColors = {
  background: "#050505",
  surface: "#111111",
  surfaceSoft: "#181614",
  gold: "#C9A45C",
  goldSoft: "#E7D3A1",
  cream: "#F5EFE3",
  muted: "#9C9387",
  matcha: "#9CAF88",
  espresso: "#3A2418"
} as const;

export const saloraRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999
} as const;

export const saloraShadows = {
  soft: "0 18px 60px rgba(0, 0, 0, 0.35)",
  gold: "0 18px 60px rgba(201, 164, 92, 0.14)"
} as const;

export const whatsappPlaceholderNumber = "96800000000";

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const saloraRuntime = {
  siteUrl: runtimeEnv.NEXT_PUBLIC_SALORA_SITE_URL || "https://salora.cafe",
  whatsappNumber: runtimeEnv.NEXT_PUBLIC_SALORA_WHATSAPP_NUMBER || whatsappPlaceholderNumber,
  instagramUrl: runtimeEnv.NEXT_PUBLIC_SALORA_INSTAGRAM_URL || "https://instagram.com/salora.cafe",
  analyticsEnabled: runtimeEnv.NEXT_PUBLIC_SALORA_ANALYTICS_ENABLED === "true"
} as const;

export function assertServerSecret(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is required in production runtime.`);
  }

  return value;
}
