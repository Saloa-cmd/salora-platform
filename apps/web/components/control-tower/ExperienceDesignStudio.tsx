"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExperiencePageV2, ExperienceSectionV2 } from "@salora/types";
import { ExperienceRenderer } from "@/components/experience/ExperienceRenderer";
import { SaloraIcon } from "@/components/ui/SaloraIcon";
import { controlTowerGet, controlTowerPatch } from "@/lib/control-tower/client";
import { SALORA_COMPONENT_REGISTRY, type ExperienceComponentId } from "@/lib/experience/component-registry";
import { defaultExperiencePageV2 } from "@/lib/experience/default-page-v2";
import { useControlTowerLocale } from "./ControlTowerLocale";

type Payload = { page: ExperiencePageV2; draftVersion: number; publicationAuthority: "NONE_PR3" };
type Device = "mobile" | "tablet" | "desktop" | "wide";
const field = "min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-[var(--cream)] outline-none focus:border-[var(--border-gold)]";
const deviceWidths: Record<Device, string> = { mobile: "390px", tablet: "768px", desktop: "1180px", wide: "1440px" };
const labels: Record<ExperienceComponentId, { ar: string; en: string }> = Object.fromEntries(Object.entries(SALORA_COMPONENT_REGISTRY).map(([id, item]) => [id, item.displayName])) as never;

function makeSection(componentId: ExperienceComponentId): ExperienceSectionV2 {
  const base = { id: `${componentId.split(".")[0]}-${crypto.randomUUID().slice(0, 8)}`, componentVersion: 1 as const, visible: true, responsive: { width: "wide" as const, spacing: "lg" as const, alignment: "start" as const, surface: "background" as const } };
  if (componentId === "hero.luxury.v1") return { ...base, componentId, variant: "split", responsive: { ...base.responsive, width: "full", surface: "hero" }, content: { title: { ar: "عنوان التجربة", en: "Experience headline" }, subtitle: { ar: "اكتب رسالة واضحة للزائر.", en: "Write a clear message for the guest." }, primaryAction: { label: { ar: "اكتشف المنيو", en: "Explore menu" }, destination: "/menu" } } };
  if (componentId === "menu.product-grid.premium.v1") return { ...base, componentId, variant: "grid", content: { heading: { ar: "مختارات سالورا", en: "SALORA selections" }, source: "menu-authority-adapter", featuredOnly: true, maxItems: 6 } };
  if (componentId === "story.editorial.v1") return { ...base, componentId, variant: "text-only", content: { heading: { ar: "قصة سالورا", en: "The SALORA story" }, body: { ar: "أضف القصة هنا.", en: "Add the story here." } } };
  if (componentId === "location.map-card.v1") return { ...base, componentId, variant: "split", content: { heading: { ar: "زورونا", en: "Visit us" }, address: { ar: "صلالة، سلطنة عُمان", en: "Salalah, Oman" }, hours: { ar: "يوميًا", en: "Daily" }, latitude: 17.011517, longitude: 54.174511, action: { label: { ar: "الاتجاهات", en: "Directions" }, destination: "https://maps.google.com/?q=17.011517,54.174511", external: true, icon: "location" } } };
  return { ...base, componentId: "cta.gold.v1", variant: "solid", content: { heading: { ar: "جاهز للحظة سالورا؟", en: "Ready for your SALORA moment?" }, action: { label: { ar: "افتح المنيو", en: "Open menu" }, destination: "/menu" } } };
}

function localizedFields(section: ExperienceSectionV2): Array<{ key: string; label: string; value: { ar: string; en: string } }> {
  if (section.componentId === "hero.luxury.v1") return [{ key: "title", label: "Title", value: section.content.title }, { key: "subtitle", label: "Subtitle", value: section.content.subtitle }];
  if (section.componentId === "menu.product-grid.premium.v1") return [{ key: "heading", label: "Heading", value: section.content.heading }, ...(section.content.description ? [{ key: "description", label: "Description", value: section.content.description }] : [])];
  if (section.componentId === "story.editorial.v1") return [{ key: "heading", label: "Heading", value: section.content.heading }, { key: "body", label: "Body", value: section.content.body }];
  if (section.componentId === "location.map-card.v1") return [{ key: "heading", label: "Heading", value: section.content.heading }, { key: "address", label: "Address", value: section.content.address }, { key: "hours", label: "Hours", value: section.content.hours }];
  return [{ key: "heading", label: "Heading", value: section.content.heading }, ...(section.content.body ? [{ key: "body", label: "Body", value: section.content.body }] : [])];
}

export function ExperienceDesignStudio() {
  const { isArabic } = useControlTowerLocale();
  const [page, setPage] = useState(defaultExperiencePageV2);
  const [selectedId, setSelectedId] = useState(defaultExperiencePageV2.sections[0]?.id ?? "");
  const [device, setDevice] = useState<Device>("desktop");
  const [previewLocale, setPreviewLocale] = useState<"ar" | "en">("ar");
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [past, setPast] = useState<ExperiencePageV2[]>([]);
  const [future, setFuture] = useState<ExperiencePageV2[]>([]);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "error" | "forbidden">("loading");
  const [message, setMessage] = useState("");
  const [draftVersion, setDraftVersion] = useState(0);
  const selected = page.sections.find((section) => section.id === selectedId) ?? page.sections[0];

  useEffect(() => { void (async () => { const result = await controlTowerGet<Payload>("/api/control-tower/experience"); if (result.status === "success" && result.data) { setPage(result.data.page); setSelectedId(result.data.page.sections[0]?.id ?? ""); setDraftVersion(result.data.draftVersion); setStatus("idle"); } else { setStatus(result.status === "forbidden" ? "forbidden" : "error"); setMessage(result.message ?? "Unable to load the draft."); } })(); }, []);
  useEffect(() => { const guard = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard); }, [dirty]);

  function commit(next: ExperiencePageV2) { setPast((items) => [...items.slice(-19), page]); setFuture([]); setPage({ ...next, status: "DRAFT" }); setDirty(true); }
  function updateSelected(updater: (section: ExperienceSectionV2) => ExperienceSectionV2) { if (!selected) return; commit({ ...page, sections: page.sections.map((section) => section.id === selected.id ? updater(section) : section) }); }
  function move(offset: number) { if (!selected) return; const from = page.sections.findIndex((section) => section.id === selected.id); const to = from + offset; if (to < 0 || to >= page.sections.length) return; const sections = [...page.sections]; const current = sections[from]; const target = sections[to]; if (!current || !target) return; sections[from] = target; sections[to] = current; commit({ ...page, sections }); }
  function undo() { const previous = past.at(-1); if (!previous) return; setFuture((items) => [page, ...items]); setPast((items) => items.slice(0, -1)); setPage(previous); setDirty(true); }
  function redo() { const next = future[0]; if (!next) return; setPast((items) => [...items, page]); setFuture((items) => items.slice(1)); setPage(next); setDirty(true); }
  async function save() { setStatus("saving"); setMessage(""); const result = await controlTowerPatch<Payload>("/api/control-tower/experience", { action: "save", page: { ...page, status: "DRAFT" }, expectedVersion: draftVersion }); if (result.status === "success" && result.data) { setPage(result.data.page); setDraftVersion(result.data.draftVersion); setDirty(false); setStatus("idle"); setMessage(isArabic ? "حُفظت المسودة. لم يتم النشر." : "Draft saved. Nothing was published."); } else { setStatus(result.status === "forbidden" ? "forbidden" : "error"); setMessage(result.message ?? "Draft save failed."); } }

  const platform = device === "mobile" ? "mobile" : "web";
  const library = useMemo(() => Object.values(SALORA_COMPONENT_REGISTRY), []);
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[var(--surface)] shadow-2xl" aria-label={isArabic ? "استوديو التجربة" : "Experience Studio"}>
      <header className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] px-4 py-3">
        <div className="me-auto"><p className="text-xs font-semibold text-[var(--cream)]">{isArabic ? "الصفحة الرئيسية" : "Homepage"}</p><p className="text-[10px] uppercase tracking-[0.18em] text-amber-300">DRAFT ONLY · PR3</p></div>
        {(["mobile", "tablet", "desktop", "wide"] as Device[]).map((item) => <button key={item} type="button" aria-pressed={device === item} onClick={() => setDevice(item)} className={`min-h-10 rounded-xl px-3 text-xs ${device === item ? "bg-[var(--gold)] text-black" : "border border-white/10 text-[var(--muted)]"}`}>{item}</button>)}
        <select aria-label="Preview theme" value={theme} onChange={(event) => setTheme(event.target.value as never)} className={`${field} !w-auto`}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select>
        <select aria-label="Preview language" value={previewLocale} onChange={(event) => setPreviewLocale(event.target.value as never)} className={`${field} !w-auto`}><option value="ar">AR · RTL</option><option value="en">EN · LTR</option></select>
        <button type="button" onClick={undo} disabled={!past.length} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 disabled:opacity-30" aria-label="Undo"><SaloraIcon name="back" className="h-4 w-4" /></button>
        <button type="button" onClick={redo} disabled={!future.length} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 disabled:opacity-30" aria-label="Redo"><SaloraIcon name="forward" className="h-4 w-4" /></button>
        <button type="button" onClick={() => void save()} disabled={!dirty || status === "saving"} className="min-h-10 rounded-xl bg-[var(--gold)] px-4 text-xs font-bold text-black disabled:opacity-40">{status === "saving" ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ المسودة" : "Save draft")}</button>
      </header>
      {message ? <p role={status === "error" || status === "forbidden" ? "alert" : "status"} className={`border-b px-4 py-3 text-xs ${status === "error" || status === "forbidden" ? "border-red-400/20 bg-red-400/10 text-red-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>{message}</p> : null}
      <div className="grid min-h-[720px] xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="border-b border-white/[0.08] p-3 xl:border-b-0 xl:border-e" aria-label="Page tree and approved components">
          <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{isArabic ? "هيكل الصفحة" : "Page tree"}</p>
          <div className="grid gap-1">{page.sections.map((section, index) => <button key={section.id} type="button" onClick={() => setSelectedId(section.id)} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-start text-xs ${section.id === selected?.id ? "bg-[var(--gold)]/12 text-[var(--gold-soft)]" : "text-[var(--muted)] hover:bg-white/[0.05]"}`}><SaloraIcon name={section.visible ? "pages" : "close"} className="h-4 w-4" /><span className="min-w-0 flex-1 truncate">{index + 1}. {labels[section.componentId][previewLocale]}</span></button>)}</div>
          <div className="my-4 border-t border-white/[0.08]" />
          <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{isArabic ? "المكونات المعتمدة" : "Approved components"}</p>
          <div className="grid gap-2">{library.map((component) => <button key={component.id} type="button" onClick={() => { const section = makeSection(component.id); commit({ ...page, sections: [...page.sections, section] }); setSelectedId(section.id); }} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-start text-xs text-[var(--muted)] hover:border-[var(--border-gold)] hover:text-[var(--cream)]"><SaloraIcon name={component.category === "menu" ? "menu" : component.category === "location" ? "location" : component.category === "action" ? "sparkles" : "pages"} className="h-4 w-4" />{component.displayName[previewLocale]}</button>)}</div>
        </aside>
        <div className="overflow-auto bg-black/20 p-4 sm:p-6" aria-label="Live canvas">
          <div className="mx-auto min-h-[640px] overflow-hidden rounded-2xl border border-white/10 bg-[var(--background)] shadow-2xl transition-[width]" style={{ width: `min(100%, ${deviceWidths[device]})` }} data-theme={theme}>
            <ExperienceRenderer page={page} locale={previewLocale} platform={platform} />
          </div>
        </div>
        <aside className="border-t border-white/[0.08] p-4 xl:border-s xl:border-t-0" aria-label="Properties inspector">
          {selected ? <div className="grid gap-5">
            <div><p className="text-sm font-semibold">{labels[selected.componentId][previewLocale]}</p><p className="mt-1 text-xs text-[var(--muted)]">{selected.componentId}</p></div>
            <div className="flex gap-2"><button type="button" onClick={() => move(-1)} className="min-h-10 flex-1 rounded-xl border border-white/10 text-xs">{isArabic ? "لأعلى" : "Move up"}</button><button type="button" onClick={() => move(1)} className="min-h-10 flex-1 rounded-xl border border-white/10 text-xs">{isArabic ? "لأسفل" : "Move down"}</button></div>
            <label className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 px-3 text-xs text-[var(--muted)]"><span>{isArabic ? "ظاهر" : "Visible"}</span><input type="checkbox" checked={selected.visible} onChange={(event) => updateSelected((section) => ({ ...section, visible: event.target.checked }))} /></label>
            {localizedFields(selected).map((item) => <fieldset key={item.key} className="grid gap-2 rounded-xl border border-white/[0.08] p-3"><legend className="px-1 text-xs text-[var(--muted)]">{item.label}</legend><label className="grid gap-1 text-[10px] text-[var(--muted)]">العربية<textarea rows={2} value={item.value.ar} onChange={(event) => updateSelected((section) => ({ ...section, content: { ...section.content, [item.key]: { ...item.value, ar: event.target.value } } } as ExperienceSectionV2))} className={`${field} py-2`} /></label><label className="grid gap-1 text-[10px] text-[var(--muted)]">English<textarea rows={2} value={item.value.en} onChange={(event) => updateSelected((section) => ({ ...section, content: { ...section.content, [item.key]: { ...item.value, en: event.target.value } } } as ExperienceSectionV2))} className={`${field} py-2`} /></label></fieldset>)}
            <details className="rounded-xl border border-white/[0.08] p-3"><summary className="cursor-pointer text-xs font-semibold">{isArabic ? "تخطيط آمن" : "Safe layout"}</summary><div className="mt-3 grid gap-3">{(["width", "spacing", "alignment", "surface"] as const).map((key) => <label key={key} className="grid gap-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">{key}<select value={selected.responsive[key]} onChange={(event) => updateSelected((section) => ({ ...section, responsive: { ...section.responsive, [key]: event.target.value } } as ExperienceSectionV2))} className={field}>{(key === "width" ? ["full", "wide", "content", "compact"] : key === "spacing" ? ["none", "xs", "sm", "md", "lg", "xl"] : key === "alignment" ? ["start", "center", "end"] : ["background", "surface", "elevated", "brand", "hero"]).map((value) => <option key={value}>{value}</option>)}</select></label>)}</div></details>
            <button type="button" disabled={page.sections.length <= 1} onClick={() => { commit({ ...page, sections: page.sections.filter((section) => section.id !== selected.id) }); setSelectedId(page.sections.find((section) => section.id !== selected.id)?.id ?? ""); }} className="min-h-11 rounded-xl border border-red-400/20 text-xs font-semibold text-red-200 disabled:opacity-30">{isArabic ? "إزالة من المسودة" : "Remove from draft"}</button>
          </div> : <p className="text-sm text-[var(--muted)]">{isArabic ? "اختر مكونًا." : "Select a component."}</p>}
        </aside>
      </div>
    </section>
  );
}
