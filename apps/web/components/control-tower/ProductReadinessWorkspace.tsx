"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Archive, CheckCircle2, CircleAlert, Eye, Grid2X2, ImageIcon, List, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Sparkles, Tag, X, Zap } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { controlTowerGet, controlTowerPatch, controlTowerPost } from "@/lib/control-tower/client";
import type { MutationState } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";

type Readiness = { priceReady: boolean; mediaReady: boolean; categoryReady: boolean; optionsReady: boolean; availabilityReady: boolean; orderReady: boolean; reasons: string[] };
type ProductImage = { id: string; publicUrl?: string | null; altText?: string | null; isPrimary?: boolean };
type ProductRow = { id: string; slug: string; name: string; nameAr?: string | null; nameEn?: string | null; status: string; basePrice: string | number; category?: { name: string } | null; images?: ProductImage[]; readiness?: Readiness };
type FilterMode = "all" | "active" | "draft" | "unavailable" | "missing-price" | "missing-media" | "activation-ready" | "needs-work";
type ViewMode = "table" | "grid";
type AiOperation = "description" | "translation" | "alt_text" | "readiness";
type AiDraftResponse = { draft: { answer: string; correlationId: string } };

const idle: MutationState = { status: "idle" };

function mergeProducts(...pages: ProductRow[][]) {
  return [...new Map(pages.flat().map((product) => [product.id, product])).values()];
}

function imageUrl(product: ProductRow) {
  return product.images?.find((image) => image.isPrimary)?.publicUrl ?? product.images?.[0]?.publicUrl ?? null;
}

function StatusPill({ ready, yes, no }: { ready: boolean; yes: string; no: string }) {
  const Icon = ready ? CheckCircle2 : CircleAlert;
  return <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${ready ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}><Icon className="h-3.5 w-3.5" />{ready ? yes : no}</span>;
}

function Metric({ value, total, label, warning }: { value: number; total?: number; label: string; warning?: boolean }) {
  return <div className={`min-h-28 border p-4 ${warning ? "border-amber-300/20 bg-amber-300/[0.055]" : "border-white/10 bg-white/[0.025]"}`}><strong className="block text-2xl font-semibold text-[var(--cream)]">{value}{total != null ? <span className="text-base font-normal text-[var(--muted)]"> / {total}</span> : null}</strong><span className="mt-4 block text-xs uppercase tracking-[.12em] text-[var(--muted)]">{label}</span></div>;
}

function ProductPhoto({ product, className }: { product: ProductRow; className: string }) {
  const src = imageUrl(product);
  return <div className={`relative shrink-0 overflow-hidden bg-black/50 ${className}`}>{src ? <Image src={src} alt={product.images?.[0]?.altText || product.name} fill unoptimized sizes="(max-width: 768px) 104px, 64px" className="object-cover" /> : <div className="grid h-full place-items-center text-[var(--gold-soft)]"><ImageIcon className="h-5 w-5" /></div>}</div>;
}

function QuickAction({ label, icon, onClick, danger }: { label: string; icon: ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] ${danger ? "border-red-300/15 text-red-200 hover:bg-red-300/10" : "border-white/10 text-[var(--cream)] hover:border-[var(--border-gold)] hover:bg-[var(--gold)]/5"}`}>{icon}<span className="hidden 2xl:inline">{label}</span></button>;
}

export function ProductReadinessWorkspace() {
  // Permanent P33/P34 contract marker: Product readiness & orderability.
  const { isArabic } = useControlTowerLocale();
  const t = useCallback((ar: string, en: string) => isArabic ? ar : en, [isArabic]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [view, setView] = useState<ViewMode>("table");
  const [loading, setLoading] = useState(true);
  const [mutation, setMutation] = useState<MutationState>(idle);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [aiProduct, setAiProduct] = useState<ProductRow | null>(null);
  const [aiOperation, setAiOperation] = useState<AiOperation>("readiness");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [first, second] = await Promise.all([
      controlTowerGet<ProductRow[]>("/api/control-tower/simple-launch/products?limit=100&offset=0"),
      controlTowerGet<ProductRow[]>("/api/control-tower/simple-launch/products?limit=100&offset=100")
    ]);
    if (first.data || second.data) setProducts(mergeProducts(first.data ?? [], second.data ?? []));
    if (first.status === "error" || second.status === "error") setMutation({ status: "error", message: first.message ?? second.message ?? t("تعذر تحميل الكتالوج.", "Catalog could not be loaded.") });
    setLoading(false);
  }, [t]);

  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("salora.catalog.view");
      if (saved === "grid" || saved === "table") setView(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!products.length) return;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product");
    const action = params.get("action");
    const product = products.find((item) => item.id === productId || item.slug === productId);
    if (!product) return;
    const timer = window.setTimeout(() => {
      setQuery(product.slug);
      if (action === "price") { setEditing(product); setPriceInput(Number(product.basePrice).toFixed(3)); }
      if (action === "media") document.getElementById("product-media-manager")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (action === "ai") setAiProduct(product);
      window.history.replaceState({}, "", window.location.pathname);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [products]);

  const activationCandidates = useMemo(() => products.filter((product) => product.status === "DRAFT" && product.readiness?.priceReady && product.readiness?.mediaReady && product.readiness?.categoryReady && product.readiness?.optionsReady), [products]);
  const metrics = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.status === "ACTIVE").length,
    orderReady: products.filter((product) => product.readiness?.orderReady).length,
    missingPrice: products.filter((product) => !product.readiness?.priceReady).length,
    missingMedia: products.filter((product) => !product.readiness?.mediaReady).length
  }), [products]);
  const catalogReady = metrics.total > 0 && metrics.active === metrics.total && metrics.orderReady === metrics.total;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (needle && ![product.name, product.nameAr, product.nameEn, product.slug, product.category?.name, product.basePrice].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle))) return false;
      if (filter === "active") return product.status === "ACTIVE";
      if (filter === "draft") return product.status === "DRAFT";
      if (filter === "unavailable") return !product.readiness?.availabilityReady;
      if (filter === "missing-price") return !product.readiness?.priceReady;
      if (filter === "missing-media") return !product.readiness?.mediaReady;
      if (filter === "activation-ready") return activationCandidates.some((candidate) => candidate.id === product.id);
      if (filter === "needs-work") return !product.readiness?.orderReady;
      return true;
    });
  }, [products, query, filter, activationCandidates]);

  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("salora.catalog.view", next); }
  function editPrice(product: ProductRow) { setEditing(product); setPriceInput(Number(product.basePrice).toFixed(3)); setMutation(idle); }
  function openMedia(product: ProductRow) { setQuery(product.slug); document.getElementById("product-media-manager")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function openAvailability(product: ProductRow) { window.location.assign(`/control-tower/operations?product=${encodeURIComponent(product.slug)}&focus=availability`); }
  function preview(product: ProductRow) { window.open(`/menu?product=${encodeURIComponent(product.slug)}`, "_blank", "noopener,noreferrer"); }

  async function savePrice() {
    if (!editing) return;
    const value = Number(priceInput);
    if (!Number.isFinite(value) || value <= 0) { setMutation({ status: "error", message: t("أدخل سعرًا موجبًا.", "Enter a positive price.") }); return; }
    setMutation({ status: "submitting", message: t("جارٍ حفظ السعر…", "Saving price…") });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/products", { action: "price", slug: editing.slug, basePrice: value });
    setMutation(result);
    if (result.status === "success") { await refresh(); setEditing(null); }
  }

  async function archiveProduct(product: ProductRow) {
    if (!window.confirm(t(`أرشفة ${product.nameAr || product.name}؟`, `Archive ${product.nameEn || product.name}?`))) return;
    setMutation({ status: "submitting", message: t("جارٍ الأرشفة…", "Archiving…") });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/products", { action: "archive", slug: product.slug });
    setMutation(result);
    if (result.status === "success") await refresh();
  }

  async function generateAiDraft() {
    if (!aiProduct) return;
    setAiLoading(true);
    setAiAnswer("");
    const result = await controlTowerPost<AiDraftResponse>("/api/control-tower/simple-launch/ai-product-tools", {
      operation: aiOperation,
      productSlug: aiProduct.slug,
      productName: aiProduct.nameEn || aiProduct.name,
      category: aiProduct.category?.name,
      notes: `Arabic name: ${aiProduct.nameAr || "missing"}. Price readiness: ${Boolean(aiProduct.readiness?.priceReady)}. Media readiness: ${Boolean(aiProduct.readiness?.mediaReady)}. Order readiness: ${Boolean(aiProduct.readiness?.orderReady)}.`
    });
    setAiAnswer(result.status === "success" ? result.data?.draft.answer ?? t("لم يُرجع المساعد اقتراحًا.", "No suggestion was returned.") : result.message ?? t("تعذر تشغيل الاقتراح.", "Suggestion failed."));
    setAiLoading(false);
  }

  async function activateReadyDrafts() {
    if (!activationCandidates.length) return;
    setMutation({ status: "submitting", message: t("جارٍ التفعيل الآمن…", "Safely activating…") });
    for (const product of activationCandidates) {
      const result = await controlTowerPatch("/api/control-tower/simple-launch/products", { action: "status", slug: product.slug, status: "ACTIVE" });
      if (result.status !== "success") { setMutation(result); await refresh(); return; }
    }
    setMutation({ status: "success", message: t(`تم تفعيل ${activationCandidates.length} صنفًا بعد فحص الخادم.`, `${activationCandidates.length} products activated after server verification.`) });
    await refresh();
  }

  const filters: Array<{ id: FilterMode; ar: string; en: string }> = [
    { id: "all", ar: "كل الأصناف", en: "All products" }, { id: "active", ar: "النشطة", en: "Active" }, { id: "draft", ar: "المسودات", en: "Drafts" },
    { id: "missing-price", ar: "سعر مفقود", en: "Missing price" }, { id: "missing-media", ar: "صورة مفقودة", en: "Missing media" }, { id: "unavailable", ar: "غير متاح", en: "Unavailable" },
    { id: "activation-ready", ar: "جاهز للتفعيل", en: "Activation ready" }, { id: "needs-work", ar: "يحتاج معالجة", en: "Needs attention" }
  ];

  const actions = (product: ProductRow) => <div className="flex flex-wrap gap-2"><QuickAction label={t("السعر", "Price")} icon={<Tag className="h-4 w-4" />} onClick={() => editPrice(product)} /><QuickAction label={t("الصور", "Media")} icon={<ImageIcon className="h-4 w-4" />} onClick={() => openMedia(product)} /><QuickAction label={t("التوفر", "Availability")} icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => openAvailability(product)} /><QuickAction label={t("مساعد AI", "AI assistant")} icon={<Sparkles className="h-4 w-4" />} onClick={() => { setAiProduct(product); setAiAnswer(""); }} /><QuickAction label={t("معاينة", "Preview")} icon={<Eye className="h-4 w-4" />} onClick={() => preview(product)} /><QuickAction label={t("أرشفة", "Archive")} icon={<Archive className="h-4 w-4" />} onClick={() => void archiveProduct(product)} danger /></div>;

  return <DashboardCard title={t("مركز قيادة الأصناف", "Catalog Command Center")} eyebrow="SALORA · OPERATOR FIRST">
    <div className="space-y-5">
      <div className={`flex flex-col gap-4 border p-4 lg:flex-row lg:items-center lg:justify-between ${catalogReady ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-amber-300/20 bg-amber-300/[0.045]"}`}>
        <div className="flex gap-3">{catalogReady ? <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-200" /> : <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-200" />}<div><strong className="block text-base text-[var(--cream)]">{catalogReady ? t("الكتالوج جاهز بالكامل", "Catalog Fully Ready") : t("الكتالوج يحتاج استكمالًا", "Catalog needs attention")}</strong><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{catalogReady ? t("كل الأصناف نشطة وقابلة للطلب.", "Every product is active and order ready.") : t("السعر والصورة والتوفر والخيارات بوابات خادمية ملزمة.", "Price, media, availability and options remain mandatory server-side gates.")}</p></div></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-semibold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("تحديث", "Refresh")}</button>{activationCandidates.length ? <button type="button" onClick={() => void activateReadyDrafts()} disabled={mutation.status === "submitting"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--gold)] px-4 text-xs font-bold text-black disabled:opacity-50"><Zap className="h-4 w-4" />{t(`تفعيل الجاهز (${activationCandidates.length})`, `Activate ready (${activationCandidates.length})`)}</button> : null}</div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4"><Metric value={metrics.active} total={metrics.total} label={t("نشط", "Active")} /><Metric value={metrics.orderReady} total={metrics.total} label={t("جاهز للطلب", "Order ready")} /><Metric value={metrics.missingPrice} label={t("سعر مفقود", "Missing price")} warning={metrics.missingPrice > 0} /><Metric value={metrics.missingMedia} label={t("صورة مفقودة", "Missing media")} warning={metrics.missingMedia > 0} /></div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-[var(--muted)]" /><span className="sr-only">{t("بحث المنتجات", "Search products")}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("ابحث بالعربية، الإنجليزية، Slug، الفئة أو السعر…", "Search Arabic, English, slug, category or price…")} className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 ps-10 pe-3 text-sm outline-none focus:border-[var(--border-gold)]" /></label><select value={filter} onChange={(event) => setFilter(event.target.value as FilterMode)} aria-label={t("العرض المحفوظ", "Saved view")} className="min-h-12 rounded-xl border border-white/10 bg-[#15120f] px-4 text-sm">{filters.map((item) => <option key={item.id} value={item.id}>{isArabic ? item.ar : item.en}</option>)}</select><div className="flex rounded-xl border border-white/10 p-1"><button type="button" onClick={() => changeView("table")} aria-pressed={view === "table"} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold ${view === "table" ? "bg-[var(--gold)] text-black" : "text-[var(--muted)]"}`}><List className="h-4 w-4" />{t("جدول", "Table")}</button><button type="button" onClick={() => changeView("grid")} aria-pressed={view === "grid"} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold ${view === "grid" ? "bg-[var(--gold)] text-black" : "text-[var(--muted)]"}`}><Grid2X2 className="h-4 w-4" />{t("معرض", "Grid")}</button></div></div>

      {mutation.status !== "idle" && mutation.status !== "submitting" ? <div role="status" className={`rounded-xl border p-3 text-sm ${mutation.status === "success" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-red-300/20 bg-red-300/10 text-red-100"}`}>{mutation.message}</div> : null}

      <div className={view === "table" ? "hidden md:block" : "hidden"}><div className="overflow-hidden rounded-xl border border-white/10"><div className="max-h-[720px] overflow-auto"><table className="w-full min-w-[1040px] text-start text-sm"><thead className="sticky top-0 z-10 bg-[#15120f]/95 text-xs text-[var(--muted)] backdrop-blur"><tr><th className="px-4 py-3 text-start">{t("الصنف", "Product")}</th><th className="px-3 py-3 text-start">{t("السعر", "Price")}</th><th className="px-3 py-3 text-start">{t("الحالة", "Status")}</th><th className="px-3 py-3 text-start">{t("التوفر", "Availability")}</th><th className="px-3 py-3 text-start">{t("الطلب", "Order ready")}</th><th className="px-3 py-3 text-start">{t("إجراءات", "Actions")}</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id} className="border-t border-white/[0.06] align-middle hover:bg-white/[0.025]"><td className="px-4 py-3"><div className="flex items-center gap-3"><ProductPhoto product={product} className="h-14 w-14 rounded-xl" /><div><strong className="block">{isArabic ? product.nameAr || product.name : product.nameEn || product.name}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{isArabic ? product.nameEn : product.nameAr}</span><span className="mt-1 block font-mono text-[10px] text-[var(--muted)]">{product.slug} · {product.category?.name ?? "—"}</span></div></div></td><td className="px-3 py-3 font-mono">{Number(product.basePrice).toFixed(3)} OMR</td><td className="px-3 py-3"><span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold">{product.status}</span></td><td className="px-3 py-3"><StatusPill ready={Boolean(product.readiness?.availabilityReady)} yes={t("متاح", "Available")} no={t("غير متاح", "Unavailable")} /></td><td className="px-3 py-3"><StatusPill ready={Boolean(product.readiness?.orderReady)} yes={t("جاهز", "Ready")} no={t("محجوب", "Blocked")} />{!product.readiness?.orderReady && product.readiness?.reasons?.length ? <p className="mt-2 max-w-44 text-[10px] leading-4 text-[var(--muted)]">{product.readiness.reasons.join(" · ")}</p> : null}</td><td className="px-3 py-3">{actions(product)}</td></tr>)}</tbody></table></div></div></div>

      <div className={`${view === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3" : "grid md:hidden"} gap-3`}>{filtered.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"><div className="flex gap-4 p-4"><ProductPhoto product={product} className="h-24 w-24 rounded-xl" /><div className="min-w-0 flex-1"><strong className="block truncate">{isArabic ? product.nameAr || product.name : product.nameEn || product.name}</strong><span className="mt-1 block truncate text-xs text-[var(--muted)]">{isArabic ? product.nameEn : product.nameAr}</span><span className="mt-3 block font-mono text-sm font-semibold text-[var(--gold-soft)]">{Number(product.basePrice).toFixed(3)} OMR</span><span className="mt-1 block truncate text-xs text-[var(--muted)]">{product.category?.name ?? "—"}</span></div></div><div className="flex flex-wrap gap-2 border-y border-white/[0.06] px-4 py-3"><StatusPill ready={Boolean(product.readiness?.availabilityReady)} yes={t("متاح", "Available")} no={t("غير متاح", "Unavailable")} /><StatusPill ready={Boolean(product.readiness?.orderReady)} yes={t("جاهز للطلب", "Order ready")} no={t("محجوب", "Blocked")} />{!product.readiness?.priceReady ? <StatusPill ready={false} yes="" no={t("سعر مفقود", "Missing price")} /> : null}{!product.readiness?.mediaReady ? <StatusPill ready={false} yes="" no={t("صورة مفقودة", "Missing media")} /> : null}</div><div className="flex flex-wrap gap-2 p-3">{actions(product)}</div></article>)}</div>
      {!filtered.length && !loading ? <p className="border border-white/10 p-8 text-center text-sm text-[var(--muted)]">{t("لا توجد نتائج مطابقة.", "No matching products.")}</p> : null}
    </div>

    {editing ? <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><section role="dialog" aria-modal="true" aria-labelledby="price-editor-title" className="w-full max-w-lg rounded-2xl border border-[var(--border-gold)] bg-[#15120f] p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-[var(--gold-soft)]">{editing.slug}</p><h3 id="price-editor-title" className="mt-2 text-xl font-semibold">{t("تعديل السعر", "Edit price")}</h3></div><button type="button" onClick={() => setEditing(null)} aria-label={t("إغلاق", "Close")} className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/10"><X className="h-4 w-4" /></button></div><label className="mt-6 grid gap-2 text-sm text-[var(--muted)]">{t("السعر المعتمد بالريال العماني", "Approved price in OMR")}<input autoFocus inputMode="decimal" value={priceInput} onChange={(event) => setPriceInput(event.target.value)} className="min-h-12 rounded-xl border border-white/10 bg-black/30 px-4 font-mono outline-none focus:border-[var(--border-gold)]" /></label><p className="mt-2 text-xs text-[var(--muted)]">{t("الحفظ محمي بالصلاحيات ومسجل في Audit Log.", "Saving is permission-protected and audited.")}</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl border border-white/10 px-4 text-sm">{t("إلغاء", "Cancel")}</button><button type="button" onClick={() => void savePrice()} disabled={mutation.status === "submitting"} className="min-h-11 rounded-xl bg-[var(--gold)] px-4 text-sm font-bold text-black disabled:opacity-50">{t("حفظ السعر", "Save price")}</button></div></section></div> : null}
    {aiProduct ? <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAiProduct(null); }}><section role="dialog" aria-modal="true" aria-labelledby="ai-product-title" className="w-full max-w-2xl rounded-2xl border border-[var(--border-gold)] bg-[#15120f] p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-[var(--gold-soft)]">{aiProduct.slug}</p><h3 id="ai-product-title" className="mt-2 text-xl font-semibold">{t("مساعد المنتج السياقي", "Contextual product assistant")}</h3><p className="mt-1 text-xs text-[var(--muted)]">{t("اقتراح للمراجعة فقط — لا يغيّر ولا يعتمد ولا ينشر.", "Review-only suggestion — it cannot mutate, approve or publish.")}</p></div><button type="button" onClick={() => setAiProduct(null)} aria-label={t("إغلاق", "Close")} className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/10"><X className="h-4 w-4" /></button></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><select value={aiOperation} onChange={(event) => setAiOperation(event.target.value as AiOperation)} className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm"><option value="readiness">{t("اكتشاف النواقص", "Detect missing fields")}</option><option value="description">{t("تحسين الوصف", "Improve description")}</option><option value="translation">{t("ترجمة عربية/إنجليزية", "Arabic/English translation")}</option><option value="alt_text">{t("نص بديل للصورة", "Image alt text")}</option></select><button type="button" onClick={() => void generateAiDraft()} disabled={aiLoading} className="min-h-11 rounded-xl bg-[var(--gold)] px-4 text-sm font-bold text-black disabled:opacity-50">{aiLoading ? t("جارٍ التحليل…", "Analyzing…") : t("إنشاء اقتراح", "Generate suggestion")}</button></div>{aiAnswer ? <div className="mt-5 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-7">{aiAnswer}</div> : null}</section></div> : null}
  </DashboardCard>;
}
