"use client";

import { Bot, Languages, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConciergePreview } from "./ConciergePreview";

type Language = "ar" | "en";
type Availability = "checking" | "ready" | "unavailable";
type ProductsEnvelope = {
  data?: unknown[];
  runtime?: {
    stale?: boolean;
    databaseHealth?: string;
  };
};

const internalPrefixes = ["/control-tower", "/dashboard", "/login"];

export function GlobalAiConcierge() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("ar");
  const [availability, setAvailability] = useState<Availability>("checking");

  useEffect(() => {
    if (!pathname || internalPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return;
    const controller = new AbortController();
    void fetch("/api/products", { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as ProductsEnvelope | null;
        const ready = response.ok
          && Array.isArray(payload?.data)
          && payload.data.length > 0
          && payload.runtime?.databaseHealth === "available"
          && payload.runtime?.stale === false;
        setAvailability(ready ? "ready" : "unavailable");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAvailability("unavailable");
      });
    return () => controller.abort();
  }, [pathname]);

  if (!pathname || internalPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;
  if (availability !== "ready") return null;

  const rtl = language === "ar";
  const label = rtl ? "مساعد سالورا" : "SALORA Concierge";

  return (
    <aside className="fixed bottom-4 end-4 z-[80] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3" dir={rtl ? "rtl" : "ltr"}>
      {open ? (
        <div role="dialog" aria-label={label} className="w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-[var(--background)]/95 p-2 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-[var(--cream)]">{label}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{rtl ? "اقتراحات تساعدك تختار لحظتك" : "Thoughtful suggestions for your SALORA moment"}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setLanguage(rtl ? "en" : "ar")} className="grid size-9 place-items-center rounded-full border border-white/10 text-[var(--muted)] transition hover:border-[var(--border-gold)] hover:text-[var(--cream)]" aria-label={rtl ? "Switch to English" : "التبديل إلى العربية"}><Languages className="size-4" /></button>
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full border border-white/10 text-[var(--muted)] transition hover:border-[var(--border-gold)] hover:text-[var(--cream)]" aria-label={rtl ? "إغلاق مساعد سالورا" : "Close SALORA Concierge"}><X className="size-4" /></button>
            </div>
          </div>
          <ConciergePreview key={language} language={language} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--border-gold)] bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-black shadow-xl transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-soft)]"
        aria-expanded={open}
        aria-label={label}
      >
        <Bot className="size-5" aria-hidden="true" />
        <span>{rtl ? "ساعدني أختار" : "Help me choose"}</span>
      </button>
    </aside>
  );
}
