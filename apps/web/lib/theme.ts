import type { ResolvedTheme, ThemePreference } from "@salora/ui";

export const THEME_COOKIE = "salora_theme";
export const THEME_STORAGE = "salora.theme.v1";
export const THEME_EVENT = "salora:theme-change";
export const THEME_PREFERENCES = ["dark", "light", "system"] as const;

export function isThemePreference(value: unknown): value is ThemePreference { return typeof value === "string" && THEME_PREFERENCES.includes(value as ThemePreference); }
export function resolveBrowserTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme { return preference === "system" ? (prefersDark ? "dark" : "light") : preference; }

export const themeBootstrapScript = `(()=>{try{const n='${THEME_COOKIE}',k='${THEME_STORAGE}',r=document.documentElement,m=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)')),c=m?decodeURIComponent(m[1]):'',l=localStorage.getItem(k),p=['dark','light','system'].includes(c)?c:(['dark','light','system'].includes(l)?l:'system'),d=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;r.dataset.themePreference=p;r.dataset.theme=d;r.style.colorScheme=d}catch{}})();`;
