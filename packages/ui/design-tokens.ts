export const designTokens = {
  colors: {
    background: "#050505",
    surface: "#111111",
    surfaceSoft: "#181614",
    surfaceRaised: "#201C18",
    gold: "#C9A45C",
    goldSoft: "#E7D3A1",
    cream: "#F5EFE3",
    muted: "#9C9387",
    matcha: "#9CAF88",
    espresso: "#3A2418",
    danger: "#E7A1A1"
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96
  },
  typography: {
    eyebrow: { size: 11, lineHeight: 16, letterSpacing: 2.8 },
    caption: { size: 12, lineHeight: 18 },
    body: { size: 15, lineHeight: 23 },
    bodyLarge: { size: 17, lineHeight: 28 },
    subtitle: { size: 21, lineHeight: 28 },
    title: { size: 30, lineHeight: 36 },
    display: { size: 56, lineHeight: 60 }
  },
  radii: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
    pill: 999
  },
  shadows: {
    soft: "0 18px 60px rgba(0, 0, 0, 0.35)",
    raised: "0 24px 80px rgba(0, 0, 0, 0.44)",
    gold: "0 18px 70px rgba(201, 164, 92, 0.16)"
  },
  borders: {
    subtle: "rgba(245, 239, 227, 0.10)",
    strong: "rgba(245, 239, 227, 0.18)",
    gold: "rgba(201, 164, 92, 0.30)"
  }
} as const;

export type DesignTokens = typeof designTokens;
