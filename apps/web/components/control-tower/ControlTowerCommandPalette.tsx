"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SaloraIcon } from "@/components/ui/SaloraIcon";
import { controlTowerSections } from "@/lib/control-tower/registry";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";
import { controlTowerGet } from "@/lib/control-tower/client";

type SearchResult = { id: string; type: "product" | "category" | "order" | "customer"; title: string; detail?: string; href: string };

export function ControlTowerCommandPalette({ visibleSections, open, onOpenChange }: { visibleSections: ControlTowerSectionId[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { tr } = useControlTowerLocale();
  const [query, setQuery] = useState("");
  const [entities, setEntities] = useState<SearchResult[]>([]);
  const [resolvedQuery, setResolvedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = useMemo(() => controlTowerSections.filter((section) => visibleSections.includes(section.id)).filter((section) => `${section.label} ${section.commandLabel} ${section.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase().trim())), [query, visibleSections]);

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); onOpenChange(!open); }
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onOpenChange, open]);

  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()); }, [open]);
  useEffect(() => {
    const normalized = query.trim();
    if (!open || normalized.length < 2) return;
    const timer = window.setTimeout(() => { void controlTowerGet<{ results: SearchResult[] }>(`/api/control-tower/search?q=${encodeURIComponent(normalized)}`).then((result) => { setEntities(result.status === "success" ? result.data?.results ?? [] : []); setResolvedQuery(normalized); }); }, 250);
    return () => window.clearTimeout(timer);
  }, [open, query]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-start bg-black/65 px-4 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      <section role="dialog" aria-modal="true" aria-label={tr("Command palette")} className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-gold)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <SaloraIcon name="search" className="h-5 w-5 text-[var(--gold-soft)]" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Search pages and commands")} className="min-h-14 w-full bg-transparent text-sm text-[var(--cream)] outline-none placeholder:text-[var(--muted)]" />
          <kbd className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-[var(--muted)]">ESC</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {commands.length ? <><p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{tr("Commands")}</p>{commands.map((section) => (
            <button key={section.id} type="button" onClick={() => { router.push(`/control-tower/${section.id}`); onOpenChange(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[var(--gold-soft)]"><SaloraIcon name={section.icon} className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--cream)]">{tr(section.commandLabel)}</span><span className="mt-1 block truncate text-xs text-[var(--muted)]">{tr(section.description)}</span></span>
              <SaloraIcon name="forward" className="h-4 w-4 text-[var(--muted)]" />
            </button>
          ))}</> : null}
          {query.trim().length >= 2 ? <div className="mt-2 border-t border-white/10 pt-2"><p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{tr("Global results")}</p>{resolvedQuery !== query.trim() ? <p className="px-4 py-4 text-sm text-[var(--muted)]">{tr("Searching permitted data…")}</p> : entities.length ? entities.map((result) => <button key={`${result.type}-${result.id}`} type="button" onClick={() => { router.push(result.href); onOpenChange(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start hover:bg-white/[0.06]"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] text-[var(--gold-soft)]"><SaloraIcon name={result.type === "order" ? "orders" : result.type === "customer" ? "user" : "menu"} className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{result.title}</span><span className="mt-1 block truncate text-xs text-[var(--muted)]">{result.type}{result.detail ? ` · ${result.detail}` : ""}</span></span></button>) : <p className="px-4 py-4 text-sm text-[var(--muted)]">{tr("No permitted entity matches your search.")}</p>}</div> : null}
        </div>
        <footer className="border-t border-white/10 px-4 py-3 text-xs text-[var(--muted)]">{tr("Commands are filtered by your current permissions. Server authorization remains authoritative.")}</footer>
      </section>
    </div>
  );
}
