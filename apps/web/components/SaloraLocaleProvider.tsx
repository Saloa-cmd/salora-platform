"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  SALORA_LOCALE_COOKIE,
  SALORA_LOCALE_STORAGE_KEY,
  saloraLocaleDirection,
  type SaloraLocale
} from "@/lib/locale";

type SaloraLocaleContextValue = {
  locale: SaloraLocale;
  isArabic: boolean;
  setLocale: (locale: SaloraLocale) => void;
};

const SaloraLocaleContext = createContext<SaloraLocaleContextValue | null>(null);

export function SaloraLocaleProvider({
  children,
  initialLocale
}: {
  children: ReactNode;
  initialLocale: SaloraLocale;
}) {
  const [locale, setLocaleState] = useState<SaloraLocale>(initialLocale);

  const setLocale = useCallback((nextLocale: SaloraLocale) => {
    setLocaleState(nextLocale);

    if (typeof document === "undefined") return;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = saloraLocaleDirection(nextLocale);

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SALORA_LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    window.localStorage.setItem(SALORA_LOCALE_STORAGE_KEY, nextLocale);
  }, []);

  const value = useMemo<SaloraLocaleContextValue>(() => ({
    locale,
    isArabic: locale === "ar",
    setLocale
  }), [locale, setLocale]);

  return <SaloraLocaleContext.Provider value={value}>{children}</SaloraLocaleContext.Provider>;
}

export function useSaloraLocale(): SaloraLocaleContextValue {
  const value = useContext(SaloraLocaleContext);
  if (!value) throw new Error("useSaloraLocale must be used inside SaloraLocaleProvider");
  return value;
}
