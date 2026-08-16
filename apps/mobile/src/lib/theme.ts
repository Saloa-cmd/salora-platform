import { designTokens, semanticThemes, type ResolvedTheme } from "@salora/ui";

const aliases = (theme: ResolvedTheme) => ({ ...semanticThemes[theme], gold: semanticThemes[theme].brand, goldSoft: semanticThemes[theme].brandHover, cream: semanticThemes[theme].foreground, muted: semanticThemes[theme].foregroundMuted, matcha: semanticThemes[theme].accent, espresso: "#3A2418" });
export const mobileThemes = { dark: aliases("dark"), light: aliases("light") } as const;
/** Dark compatibility snapshot for legacy StyleSheets; new code uses useSaloraTheme(). */
export const colors = mobileThemes.dark;

export const spacing = {
  xs: designTokens.spacing[2],
  sm: designTokens.spacing[3],
  md: designTokens.spacing[4],
  lg: designTokens.spacing[6],
  xl: designTokens.spacing[8],
  xxl: designTokens.spacing[12]
};

export const radii = designTokens.radii;

export const typography = designTokens.typography;

export const borders = designTokens.borders;
