const primitiveColors = {
  black950: "#050505", black900: "#0B0A09", black850: "#111111", black800: "#181614", black750: "#201C18",
  cream50: "#F5EFE3", cream500: "#9C9387", gold400: "#C9A45C", gold300: "#E7D3A1", green400: "#9CAF88",
  green300: "#79D6A3", amber300: "#F7CC75", red300: "#E7A1A1", blue300: "#8EC5E8"
} as const;

export const designTokens = {
  colors: {
    ...primitiveColors,
    background: primitiveColors.black950, surface: primitiveColors.black850, surfaceSoft: primitiveColors.black800,
    surfaceRaised: primitiveColors.black750, interactive: primitiveColors.black900, foreground: primitiveColors.cream50,
    foregroundMuted: primitiveColors.cream500, border: "rgba(245, 239, 227, 0.10)", borderStrong: "rgba(245, 239, 227, 0.18)",
    brand: primitiveColors.gold400, brandHover: primitiveColors.gold300, brandForeground: primitiveColors.black950,
    accent: primitiveColors.green400, success: primitiveColors.green300, warning: primitiveColors.amber300,
    danger: primitiveColors.red300, info: primitiveColors.blue300, focus: primitiveColors.gold300,
    // Compatibility aliases. New components should use semantic names above.
    gold: primitiveColors.gold400, goldSoft: primitiveColors.gold300, cream: primitiveColors.cream50,
    muted: primitiveColors.cream500, matcha: primitiveColors.green400, espresso: "#3A2418"
  },
  spacing: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96 },
  typography: {
    eyebrow: { size: 11, lineHeight: 16, letterSpacing: 2.8 }, caption: { size: 12, lineHeight: 18 },
    bodySmall: { size: 13, lineHeight: 20 }, label: { size: 14, lineHeight: 20 }, body: { size: 15, lineHeight: 23 },
    bodyLarge: { size: 17, lineHeight: 28 }, h4: { size: 18, lineHeight: 26 }, h3: { size: 21, lineHeight: 28 },
    h2: { size: 30, lineHeight: 36 }, h1: { size: 40, lineHeight: 46 }, display: { size: 56, lineHeight: 60 },
    numeric: { size: 16, lineHeight: 22, letterSpacing: 0.2 }, subtitle: { size: 21, lineHeight: 28 }, title: { size: 30, lineHeight: 36 }
  },
  radii: { control: 12, card: 18, elevatedCard: 24, modal: 24, xs: 6, sm: 8, md: 12, lg: 18, xl: 24, pill: 999 },
  shadows: { soft: "0 18px 60px rgba(0, 0, 0, 0.35)", raised: "0 24px 80px rgba(0, 0, 0, 0.44)", gold: "0 18px 70px rgba(201, 164, 92, 0.16)" },
  borders: { subtle: "rgba(245, 239, 227, 0.10)", strong: "rgba(245, 239, 227, 0.18)", gold: "rgba(201, 164, 92, 0.30)" },
  breakpoints: { mobile: 320, largeMobile: 430, tablet: 768, laptop: 1024, desktop: 1280, wide: 1536 },
  containers: { content: 1280, readable: 720 },
  motion: { durationFast: 120, durationNormal: 180, durationSlow: 280, easingStandard: "cubic-bezier(0.2, 0, 0, 1)", easingEmphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
  touchTarget: { minimum: 44 }
} as const;

export type DesignTokens = typeof designTokens;
