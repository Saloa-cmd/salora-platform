"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
  Star,
  X
} from "lucide-react";
import { controlTowerGet, controlTowerPatch } from "@/lib/control-tower/client";
import { useControlTowerLocale } from "./ControlTowerLocale";

type MediaProduct = {
  slug: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
};

type MediaDraft = {
  id: string;
  status: "DRAFT" | "APPROVED" | "REJECTED" | "PUBLISHED" | "ARCHIVED";
  source: string;
  publicUrl?: string | null;
  altText?: string | null;
  isPrimaryCandidate: boolean;
  createdAt: string;
  product: MediaProduct;
};

type ProductImage = {
  id: string;
  publicUrl?: string | null;
  altText?: string | null;
  storageBucket: string;
  storagePath: string;
  isPrimary: boolean;
  product: MediaProduct;
};

type MediaResponse = {
  images: ProductImage[];
  drafts: MediaDraft[];
  summary: MediaSummary;
};

type Filter = "ALL" | MediaDraft["status"] | "IMAGES";
type SourceScope = "AUTHORITATIVE" | "OTHER" | "ALL";

type MediaSummary = {
  catalogProducts: number;
  draftRecords: number;
  authoritativeRecords: number;
  authoritativeProducts: number;
  otherRecords: number;
  duplicateAuthoritativeRecords: number;
  liveImageRecords: number;
  liveImageProducts: number;
  authoritativeStatusCounts: Record<string, number>;
};

const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const AUTHORITATIVE_MEDIA_SOURCE = "salora_catalog_photography_v1";

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

function MediaPreview({
  src,
  alt,
  unavailableLabel
}: {
  src?: string | null;
  alt: string;
  unavailableLabel: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(201,164,92,.1),transparent_55%)] px-6 text-center text-[var(--muted)]">
        <div>
          <ImageIcon className="mx-auto h-10 w-10 text-[var(--gold-soft)]" aria-hidden="true" />
          <p className="mt-3 text-xs leading-5">{unavailableLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
      unoptimized
      onError={() => setFailedSrc(src)}
      className="object-cover transition duration-500 hover:scale-[1.02]"
    />
  );
}

export function ProductMediaManager() {
  const { isArabic } = useControlTowerLocale();
  const t = useCallback((ar: string, en: string) => isArabic ? ar : en, [isArabic]);
  const [drafts, setDrafts] = useState<MediaDraft[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [summary, setSummary] = useState<MediaSummary | null>(null);
  const [filter, setFilter] = useState<Filter>("DRAFT");
  const [sourceScope, setSourceScope] = useState<SourceScope>("AUTHORITATIVE");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const collectedDrafts: MediaDraft[] = [];
    const collectedImages: ProductImage[] = [];

    try {
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await controlTowerGet<MediaResponse>(
          `/api/control-tower/media?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
        );
        if (result.status !== "success" || !result.data) {
          throw new Error(result.message ?? t("تعذر تحميل مكتبة الصور.", "Unable to load the media library."));
        }
        collectedDrafts.push(...result.data.drafts);
        collectedImages.push(...result.data.images);
        setSummary(result.data.summary);
        if (result.data.drafts.length < PAGE_SIZE && result.data.images.length < PAGE_SIZE) break;
      }
      setDrafts(uniqueById(collectedDrafts));
      setImages(uniqueById(collectedImages));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("تعذر تحميل مكتبة الصور.", "Unable to load the media library."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const scopedDrafts = useMemo(() => drafts.filter((draft) => {
    if (sourceScope === "ALL") return true;
    const isAuthoritative = draft.source === AUTHORITATIVE_MEDIA_SOURCE;
    return sourceScope === "AUTHORITATIVE" ? isAuthoritative : !isAuthoritative;
  }), [drafts, sourceScope]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: scopedDrafts.length, IMAGES: images.length };
    for (const draft of scopedDrafts) result[draft.status] = (result[draft.status] ?? 0) + 1;
    return result;
  }, [scopedDrafts, images]);

  const sourceCounts = useMemo(() => {
    const authoritative = drafts.filter((draft) => draft.source === AUTHORITATIVE_MEDIA_SOURCE).length;
    return { AUTHORITATIVE: authoritative, OTHER: drafts.length - authoritative, ALL: drafts.length };
  }, [drafts]);

  const visibleDrafts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return scopedDrafts.filter((draft) => {
      if (filter !== "ALL" && filter !== "IMAGES" && draft.status !== filter) return false;
      if (!normalized) return true;
      return [draft.product.slug, draft.product.name, draft.product.nameAr, draft.product.nameEn, draft.altText]
        .some((value) => value?.toLowerCase().includes(normalized));
    });
  }, [scopedDrafts, filter, query]);

  const visibleImages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (filter !== "IMAGES") return [];
    return images.filter((image) => {
      if (!normalized) return true;
      return [image.product.slug, image.product.name, image.product.nameAr, image.product.nameEn, image.altText]
        .some((value) => value?.toLowerCase().includes(normalized));
    });
  }, [filter, images, query]);

  async function mutate(
    id: string,
    payload: Record<string, unknown>,
    successMessage: string,
    requiresConfirmation = false
  ) {
    if (requiresConfirmation && !window.confirm(t("هل أنت متأكد من تنفيذ هذا الإجراء؟", "Are you sure you want to perform this action?"))) {
      return;
    }
    setBusyId(id);
    setError("");
    setMessage("");
    const result = await controlTowerPatch("/api/control-tower/media", payload);
    if (result.status === "success") {
      setMessage(successMessage);
      await load();
    } else {
      setError(result.message ?? t("تعذر تنفيذ الإجراء.", "The action could not be completed."));
    }
    setBusyId(null);
  }

  const filters: Array<{ value: Filter; ar: string; en: string }> = [
    { value: "DRAFT", ar: "بانتظار المراجعة", en: "Awaiting review" },
    { value: "APPROVED", ar: "معتمدة", en: "Approved" },
    { value: "PUBLISHED", ar: "منشورة", en: "Published" },
    { value: "REJECTED", ar: "مرفوضة", en: "Rejected" },
    { value: "IMAGES", ar: "الصور الفعلية", en: "Live images" },
    { value: "ALL", ar: "كل المسودات", en: "All drafts" }
  ];

  const sourceScopes: Array<{ value: SourceScope; ar: string; en: string }> = [
    { value: "AUTHORITATIVE", ar: "مجموعة SALORA الاحترافية", en: "Professional SALORA set" },
    { value: "OTHER", ar: "مسودات أخرى محفوظة", en: "Other preserved drafts" },
    { value: "ALL", ar: "كل السجلات", en: "All records" }
  ];

  return (
    <section id="product-media-manager" className="scroll-mt-24 space-y-5 rounded-2xl border border-[var(--border-gold)] bg-[rgba(12,12,12,.92)] p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--gold-soft)]">SALORA MEDIA</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--cream)]">
            {t("إدارة صور الأصناف", "Product media manager")}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {t(
              "راجع الصور المطابقة لكل صنف، ثم اعتمدها وانشرها أو اجعل الصورة المنشورة أساسية. جميع الإجراءات محمية بالصلاحيات ومسجلة.",
              "Review each matched product image, then approve and publish it or set a published image as primary. Every action is permission-protected and audited."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-[var(--cream)] transition hover:border-[var(--border-gold)] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          {t("تحديث", "Refresh")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("ملخص تغطية صور الأصناف", "Product media coverage summary")}>
        {[
          {
            label: t("أصناف SALORA المغطاة", "SALORA products covered"),
            value: `${summary?.authoritativeProducts ?? 0}/${summary?.catalogProducts ?? 0}`,
            hint: t("صنف فريد في المجموعة الاحترافية", "unique products in the professional set")
          },
          {
            label: t("سجلات المجموعة الاحترافية", "Professional-set records"),
            value: summary?.authoritativeRecords ?? 0,
            hint: t("محفوظة دون حذف أو دمج", "preserved without deletion or merging")
          },
          {
            label: t("مسودات أخرى محفوظة", "Other preserved drafts"),
            value: summary?.otherRecords ?? 0,
            hint: t("لا تُحتسب كأصناف إضافية", "not counted as additional products")
          },
          {
            label: t("أصناف بصور منشورة", "Products with live images"),
            value: `${summary?.liveImageProducts ?? 0}/${summary?.catalogProducts ?? 0}`,
            hint: t("صور فعلية مرتبطة بالمنيو", "live images linked to the menu")
          }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/[.025] p-4">
            <p className="text-xs font-semibold text-[var(--muted)]">{item.label}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-[var(--cream)]">{item.value}</p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{item.hint}</p>
          </div>
        ))}
      </div>

      {summary && summary.authoritativeProducts !== summary.catalogProducts ? (
        <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {t(
            `تنبيه تدقيق: المجموعة الاحترافية تغطي ${summary.authoritativeProducts} من أصل ${summary.catalogProducts} صنفًا. لم يتم حذف أو تعديل أي سجل.`,
            `Audit notice: the professional set covers ${summary.authoritativeProducts} of ${summary.catalogProducts} products. No record was deleted or modified.`
          )}
        </p>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
        <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
          {t("مصدر الصور — العرض الافتراضي يعزل المجموعة المطابقة لـ117 صنفًا", "Media source — the default view isolates the set matched to 117 products")}
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("تصفية مصدر الصور", "Filter media source")}>
          {sourceScopes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSourceScope(item.value)}
              aria-pressed={sourceScope === item.value}
              className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                sourceScope === item.value
                  ? "border-[var(--gold)] bg-[rgba(201,164,92,.16)] text-[var(--cream)]"
                  : "border-white/10 bg-white/[.025] text-[var(--muted)] hover:text-[var(--cream)]"
              }`}
            >
              {t(item.ar, item.en)} <span className="font-mono">({sourceCounts[item.value]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-white/10 bg-black/25 p-3 lg:grid-cols-[minmax(240px,1fr)_auto]">
        <label className="relative block">
          <span className="sr-only">{t("البحث في الصور", "Search media")}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("ابحث باسم الصنف أو المعرّف…", "Search by product name or slug…")}
            className="min-h-11 w-full rounded-lg border border-white/10 bg-[#0b0b0b] py-2 pe-3 ps-10 text-sm text-[var(--cream)] outline-none focus:border-[var(--gold)]"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("تصفية حالة الصور", "Filter media status")}>
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                filter === item.value
                  ? "border-[var(--gold)] bg-[var(--gold)] text-black"
                  : "border-white/10 bg-white/[.035] text-[var(--muted)] hover:text-[var(--cream)]"
              }`}
            >
              {t(item.ar, item.en)} <span className="font-mono">({counts[item.value] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {(message || error) ? (
        <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}>
          {error || message}
        </p>
      ) : null}

      {loading ? (
        <div className="grid min-h-52 place-items-center rounded-xl border border-white/10 bg-black/20 text-[var(--muted)]">
          <span className="inline-flex items-center gap-2 text-sm"><LoaderCircle className="h-5 w-5 animate-spin" />{t("جارٍ تحميل مكتبة الصور…", "Loading media library…")}</span>
        </div>
      ) : (filter === "IMAGES" ? visibleImages.length : visibleDrafts.length) === 0 ? (
        <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-white/15 bg-black/20 text-center text-[var(--muted)]">
          <div><ImageIcon className="mx-auto mb-3 h-8 w-8" /><p className="text-sm">{t("لا توجد صور تطابق هذا العرض.", "No media matches this view.")}</p></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filter !== "IMAGES" ? visibleDrafts.map((draft) => {
            const name = isArabic ? draft.product.nameAr ?? draft.product.name : draft.product.nameEn ?? draft.product.name;
            return (
              <article key={draft.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <div className="relative aspect-square bg-white/[.025]">
                  <MediaPreview
                    src={draft.publicUrl}
                    alt={draft.altText ?? name}
                    unavailableLabel={t("تعذر تحميل الصورة من التخزين. استخدم «تحديث» بعد التحقق من الأصل.", "The storage image could not be loaded. Refresh after verifying the asset.")}
                  />
                  <span className="absolute start-3 top-3 rounded-full border border-white/15 bg-black/80 px-2.5 py-1 font-mono text-[10px] text-white">{draft.status}</span>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h4 className="font-semibold text-[var(--cream)]">{name}</h4>
                    <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{draft.product.slug}</p>
                    <p className="mt-1 text-[10px] text-[var(--gold-soft)]">
                      {draft.source === AUTHORITATIVE_MEDIA_SOURCE
                        ? t("مجموعة SALORA الاحترافية", "Professional SALORA set")
                        : `${t("مصدر محفوظ", "Preserved source")}: ${draft.source}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.status === "DRAFT" ? (
                      <>
                        <button type="button" disabled={busyId === draft.id} onClick={() => void mutate(draft.id, { action: "approve-draft", draftId: draft.id }, t("تم اعتماد الصورة.", "Image approved."))} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-50"><Check className="h-4 w-4" />{t("اعتماد", "Approve")}</button>
                        <button type="button" disabled={busyId === draft.id} onClick={() => void mutate(draft.id, { action: "reject-draft", draftId: draft.id, reason: "Rejected during visual review" }, t("تم رفض الصورة.", "Image rejected."), true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-2 text-xs font-semibold text-red-100 disabled:opacity-50"><X className="h-4 w-4" />{t("رفض", "Reject")}</button>
                      </>
                    ) : null}
                    {draft.status === "APPROVED" ? (
                      <button type="button" disabled={busyId === draft.id} onClick={() => void mutate(draft.id, { action: "publish-draft", draftId: draft.id }, t("تم نشر الصورة وربطها بالصنف.", "Image published and linked to the product."))} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-bold text-black disabled:opacity-50"><Send className="h-4 w-4" />{t("نشر", "Publish")}</button>
                    ) : null}
                    {!["ARCHIVED", "PUBLISHED"].includes(draft.status) ? (
                      <button type="button" disabled={busyId === draft.id} onClick={() => void mutate(draft.id, { action: "archive-draft", draftId: draft.id }, t("تمت أرشفة المسودة.", "Draft archived."), true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-[var(--muted)] disabled:opacity-50"><Archive className="h-4 w-4" />{t("أرشفة", "Archive")}</button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          }) : visibleImages.map((image) => {
            const name = isArabic ? image.product.nameAr ?? image.product.name : image.product.nameEn ?? image.product.name;
            return (
              <article key={image.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <div className="relative aspect-square bg-white/[.025]">
                  <MediaPreview
                    src={image.publicUrl}
                    alt={image.altText ?? name}
                    unavailableLabel={t("تعذر تحميل الصورة المنشورة من التخزين.", "The published storage image could not be loaded.")}
                  />
                  {image.isPrimary ? <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--gold)] px-2.5 py-1 text-[10px] font-bold text-black"><Star className="h-3 w-3 fill-current" />{t("أساسية", "Primary")}</span> : null}
                </div>
                <div className="space-y-3 p-4">
                  <div><h4 className="font-semibold text-[var(--cream)]">{name}</h4><p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{image.product.slug}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {!image.isPrimary ? <button type="button" disabled={busyId === image.id} onClick={() => void mutate(image.id, { action: "set-primary", imageId: image.id }, t("تم تعيين الصورة كأساسية.", "Image set as primary."))} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-bold text-black disabled:opacity-50"><Star className="h-4 w-4" />{t("تعيين كأساسية", "Set primary")}</button> : null}
                    <button type="button" disabled={busyId === image.id} onClick={() => void mutate(image.id, { action: "archive-image", imageId: image.id }, t("تمت أرشفة الصورة.", "Image archived."), true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-2 text-xs text-red-100 disabled:opacity-50"><Archive className="h-4 w-4" />{t("أرشفة", "Archive")}</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
