export const SALORA_LOCALE_COOKIE = "salora_locale";
export const SALORA_LOCALE_STORAGE_KEY = "salora.locale";

export type SaloraLocale = "ar" | "en";

export function isSaloraLocale(value: unknown): value is SaloraLocale {
  return value === "ar" || value === "en";
}

export function saloraLocaleDirection(locale: SaloraLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
