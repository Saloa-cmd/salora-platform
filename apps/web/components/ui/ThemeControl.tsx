"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { ThemePreference } from "@salora/ui";
import { THEME_COOKIE, THEME_EVENT, THEME_PREFERENCES, THEME_STORAGE, isThemePreference, resolveBrowserTheme } from "@/lib/theme";

const icons = { dark: Moon, light: Sun, system: Monitor } as const;
const labels = { ar: { dark: "مظهر داكن", light: "مظهر فاتح", system: "مظهر الجهاز" }, en: { dark: "Dark appearance", light: "Light appearance", system: "System appearance" } } as const;

function currentPreference(): ThemePreference {
  if (typeof document === "undefined") return "system";
  const value = document.documentElement.dataset.themePreference;
  return isThemePreference(value) ? value : "system";
}

function applyTheme(preference: ThemePreference) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = resolveBrowserTheme(preference, prefersDark);
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  window.localStorage.setItem(THEME_STORAGE, preference);
  document.cookie = `${THEME_COOKIE}=${preference}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { preference, resolved } }));
}

export function ThemeControl({ locale = "ar", compact = true }: { locale?: "ar" | "en"; compact?: boolean }) {
  const preference = useSyncExternalStore((onStoreChange) => {
    const sync = () => onStoreChange();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystem = () => { if (currentPreference() === "system") applyTheme("system"); onStoreChange(); };
    window.addEventListener(THEME_EVENT, sync);
    media.addEventListener("change", syncSystem);
    return () => { window.removeEventListener(THEME_EVENT, sync); media.removeEventListener("change", syncSystem); };
  }, currentPreference, (): ThemePreference => "system");
  const next = THEME_PREFERENCES[(THEME_PREFERENCES.indexOf(preference) + 1) % THEME_PREFERENCES.length] ?? "system";
  const Icon = icons[preference];
  const label = labels[locale][preference];
  return <button type="button" className="salora-theme-control" aria-label={`${label}. ${locale === "ar" ? "تغيير إلى" : "Change to"} ${labels[locale][next]}`} title={label} onClick={() => applyTheme(next)}><Icon aria-hidden="true" className="h-4 w-4" /><span className={compact ? "sr-only" : ""}>{label}</span></button>;
}
