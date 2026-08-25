"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, RefreshCw, Search, ShieldCheck, Zap } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { controlTowerGet, controlTowerPatch } from "@/lib/control-tower/client";
import type { MutationState } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";

type Readiness = { productSlug: string; active: boolean; priceReady: boolean; mediaReady: boolean; categoryReady: boolean; optionsReady: boolean; availabilityReady: boolean; orderReady: boolean; reasons: string[] };
type ProductRow = { id: string; slug: string; name: string; nameAr?: string | null; nameEn?: string | null; status: string; basePrice: string | number; category?: { name: string } | null; readiness?: Readiness };
type FilterMode = "all" | "active" | "draft" | "activation-ready" | "needs-work";

const initialMutation: MutationState = { status: "idle" };

function mergeProducts(...pages: ProductRow[][]) {
  const rows = new Map<string, ProductRow>();
  for (const product of pages.flat()) rows.set(product.id, product);
  return [...rows.values()];
}

function Pill({ ready, label }: { ready: boolean; label: string }) {
  const Icon = ready ? CheckCircle2 : CircleAlert;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ready ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</span>;
}

function Metric({ value, label, warning = false }: { value: number; label: string; warning?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${warning ? "border-amber-300/15 bg-amber-300/[0.07]" : "border-white/10 bg-white/[0.03]"}`}><strong className="block text-2xl font-semibold text-[var(--cream)]">{value}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{label}</span></div>;
}

export function ProductReadinessWorkspace() {
  const { isArabic } = useControlTowerLocale();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [loading, setLoading] = useState(true);
  const [mutation, setMutation] = useState<MutationState>(initialMutation);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [first, second] = await Promise.all([
      controlTowerGet<ProductRow[]>("/api/control-tower/simple-launch/products?limit=100&offset=0"),
      controlTowerGet<ProductRow[]>("/api/control-tower/simple-launch/products?limit=100&offset=100")
    ]);
    if (first.data || second.data) setProducts(mergeProducts(first.data ?? [], second.data ?? []));
    if (first.status === "error" || second.status === "error") setMutation({ status: "error", message: first.message ?? second.message ?? "Catalog readiness could not be loaded." });
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const activationCandidates = useMemo(() => products.filter((product) => product.status === "DRAFT" && product.readiness?.priceReady && product.readiness?.mediaReady && product.readiness?.categoryReady && product.readiness?.optionsReady), [products]);
  const metrics = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.status === "ACTIVE").length,
    draft: products.filter((product) => product.status === "DRAFT").length,
    orderReady: products.filter((product) => product.readiness?.orderReady).length,
    mediaReady: products.filter((product) => product.readiness?.mediaReady).length,
    activationReady: activationCandidates.length
  }), [products, activationCandidates]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matches = !needle || [product.name, product.nameAr, product.nameEn, product.slug, product.category?.name].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle));
      if (!matches) return false;
      if (filter === "active") return product.status === "ACTIVE";
      if (filter === "draft") return product.status === "DRAFT";
      if (filter === "activation-ready") return activationCandidates.some((candidate) => candidate.id === product.id);
      if (filter === "needs-work") return !product.readiness?.orderReady;
      return true;
    });
  }, [products, query, filter, activationCandidates]);

  async function activateReadyDrafts() {
    if (!activationCandidates.length) return;
    setMutation({ status: "submitting", message: isArabic ? "جارٍ التحقق والتفعيل الآمن..." : "Safely verifying and activating..." });
    setBulkProgress({ current: 0, total: activationCandidates.length });
    let completed = 0;
    for (const product of activationCandidates) {
      const result = await controlTowerPatch("/api/control-tower/simple-launch/products", { action: "status", slug: product.slug, status: "ACTIVE" });
      if (result.status !== "success") {
        setMutation({ status: result.status, message: result.message ?? (isArabic ? `تعذر تفعيل ${product.name}` : `Could not activate ${product.name}`), requestId: result.requestId });
        setBulkProgress(null);
        await refresh();
        return;
      }
      completed += 1;
      setBulkProgress({ current: completed, total: activationCandidates.length });
    }
    setMutation({ status: "success", message: isArabic ? `تم تفعيل ${completed} صنفًا بعد اجتياز بوابات الجاهزية.` : `${completed} products activated after server-side readiness verification.` });
    setBulkProgress(null);
    await refresh();
  }

  const filters: Array<{ id: FilterMode; ar: string; en: string }> = [
    { id: "all", ar: "الكل", en: "All" }, { id: "active", ar: "نشط", en: "Active" }, { id: "draft", ar: "مسودة", en: "Draft" },
    { id: "activation-ready", ar: "جاهز للتفعيل", en: "Activation ready" }, { id: "needs-work", ar: "يحتاج معالجة", en: "Needs work" }
  ];

  return <DashboardCard title={isArabic ? "جاهزية الأصناف والطلب" : "Product readiness & orderability"} eyebrow={isArabic ? "حوكمة التفعيل" : "Activation governance"}>
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{isArabic ? "كل صنف يمر عبر السعر، الصورة، القسم، الخيارات والتوفر قبل أن يصبح قابلًا للطلب. التفعيل الجماعي لا يتجاوز فحص الخادم." : "Every product must pass price, media, category, options and availability gates before it can be ordered. Bulk activation never bypasses the server guard."}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[var(--cream)] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />{isArabic ? "تحديث" : "Refresh"}</button>
          <button type="button" onClick={() => void activateReadyDrafts()} disabled={!activationCandidates.length || mutation.status === "submitting"} className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"><Zap className="h-4 w-4" aria-hidden="true" />{isArabic ? `تفعيل الجاهز (${activationCandidates.length})` : `Activate ready (${activationCandidates.length})`}</button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric value={metrics.total} label={isArabic ? "كل الأصناف" : "Total products"} /><Metric value={metrics.active} label={isArabic ? "نشط" : "Active"} /><Metric value={metrics.draft} label={isArabic ? "مسودة" : "Draft"} warning={metrics.draft > 0} /><Metric value={metrics.orderReady} label={isArabic ? "جاهز للطلب" : "Order ready"} /><Metric value={metrics.mediaReady} label={isArabic ? "صورة جاهزة" : "Media ready"} /><Metric value={metrics.activationReady} label={isArabic ? "جاهز للتفعيل" : "Activation ready"} /></div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block min-w-0 flex-1 lg:max-w-md"><Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-[var(--muted)]" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? "ابحث بالاسم أو الفئة..." : "Search name, slug or category..."} className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 ps-10 pe-3 text-sm text-[var(--cream)] outline-none focus:border-[var(--border-gold)]" /></label>
        <div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === item.id ? "border-[var(--gold)] bg-[var(--gold)] text-black" : "border-white/10 text-[var(--muted)] hover:text-[var(--cream)]"}`}>{isArabic ? item.ar : item.en}</button>)}</div>
      </div>
      {bulkProgress ? <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--gold)]/5 p-3 text-sm text-[var(--cream)]">{isArabic ? `جارٍ التفعيل ${bulkProgress.current} من ${bulkProgress.total}` : `Activating ${bulkProgress.current} of ${bulkProgress.total}`}</div> : null}
      {mutation.status !== "idle" && mutation.status !== "submitting" ? <div className={`rounded-xl border p-3 text-sm ${mutation.status === "success" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-red-300/20 bg-red-300/10 text-red-100"}`}>{mutation.message}{mutation.requestId ? <span className="mt-1 block font-mono text-[10px] opacity-70">{mutation.requestId}</span> : null}</div> : null}
      <div className="overflow-hidden rounded-2xl border border-white/10"><div className="max-h-[680px] overflow-auto"><table className="w-full min-w-[920px] text-start text-sm"><thead className="sticky top-0 z-10 bg-[#15120f]/95 text-xs text-[var(--muted)] backdrop-blur"><tr><th className="px-4 py-3 text-start">{isArabic ? "الصنف" : "Product"}</th><th className="px-3 py-3 text-start">{isArabic ? "الحالة" : "Status"}</th><th className="px-3 py-3 text-start">{isArabic ? "السعر" : "Price"}</th><th className="px-3 py-3 text-start">{isArabic ? "الصورة" : "Media"}</th><th className="px-3 py-3 text-start">{isArabic ? "القسم" : "Category"}</th><th className="px-3 py-3 text-start">{isArabic ? "الخيارات" : "Options"}</th><th className="px-3 py-3 text-start">{isArabic ? "الطلب" : "Order"}</th></tr></thead><tbody>{filtered.map((product) => { const ready = product.readiness; return <tr key={product.id} className="border-t border-white/[0.06] align-top hover:bg-white/[0.025]"><td className="px-4 py-4"><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ready?.orderReady ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{ready?.orderReady ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <CircleAlert className="h-4 w-4" aria-hidden="true" />}</span><div><strong className="block text-[var(--cream)]">{isArabic ? product.nameAr || product.name : product.nameEn || product.name}</strong><span className="mt-1 block font-mono text-[10px] text-[var(--muted)]">{product.slug}</span><span className="mt-1 block text-[11px] text-[var(--muted)]">{product.category?.name ?? "—"}</span></div></div></td><td className="px-3 py-4"><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--cream)]">{product.status}</span></td><td className="px-3 py-4"><Pill ready={Boolean(ready?.priceReady)} label={ready?.priceReady ? (isArabic ? "جاهز" : "Ready") : (isArabic ? "ناقص" : "Missing")} /></td><td className="px-3 py-4"><Pill ready={Boolean(ready?.mediaReady)} label={ready?.mediaReady ? (isArabic ? "جاهزة" : "Ready") : (isArabic ? "ناقصة" : "Missing")} /></td><td className="px-3 py-4"><Pill ready={Boolean(ready?.categoryReady)} label={ready?.categoryReady ? (isArabic ? "جاهز" : "Ready") : (isArabic ? "ناقص" : "Missing")} /></td><td className="px-3 py-4"><Pill ready={Boolean(ready?.optionsReady)} label={ready?.optionsReady ? (isArabic ? "جاهزة" : "Ready") : (isArabic ? "ناقصة" : "Missing")} /></td><td className="px-3 py-4"><Pill ready={Boolean(ready?.orderReady)} label={ready?.orderReady ? (isArabic ? "قابل للطلب" : "Order ready") : (isArabic ? "محجوب" : "Blocked")} />{!ready?.orderReady && ready?.reasons?.length ? <p className="mt-2 max-w-48 text-[10px] leading-4 text-[var(--muted)]">{ready.reasons.join(" · ")}</p> : null}</td></tr>; })}</tbody></table></div>{!filtered.length && !loading ? <p className="p-6 text-center text-sm text-[var(--muted)]">{isArabic ? "لا توجد نتائج مطابقة." : "No matching products."}</p> : null}</div>
    </div>
  </DashboardCard>;
}
