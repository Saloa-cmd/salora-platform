"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ImageIcon, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { controlTowerGet } from "@/lib/control-tower/client";
import { useControlTowerLocale } from "./ControlTowerLocale";

type MediaGovernanceSummary = {
  catalogProducts: number;
  activeCatalogProducts: number;
  authoritativeProducts: number;
  productsMissingAuthoritative: number;
  activeProductsMissingAuthoritative: number;
  liveImageProducts: number;
  activeProductsWithLiveImages: number;
  activeProductsWithoutLiveImages: number;
  productsWithoutLiveImages: number;
  productsWithMultipleLiveImages: number;
  productsWithNoPrimaryImage: number;
  productsWithMultiplePrimaryImages: number;
};

type MediaGovernanceResponse = {
  summary: MediaGovernanceSummary;
};

type AuditIssue = {
  id: string;
  title: string;
  detail: string;
};

export function MediaGovernanceAudit() {
  const { isArabic } = useControlTowerLocale();
  const t = useCallback((ar: string, en: string) => isArabic ? ar : en, [isArabic]);
  const [summary, setSummary] = useState<MediaGovernanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await controlTowerGet<MediaGovernanceResponse>("/api/control-tower/media?limit=1&offset=0");
      if (result.status !== "success" || !result.data?.summary) {
        throw new Error(result.message ?? t("تعذر تحميل تدقيق حوكمة الصور.", "Unable to load the media governance audit."));
      }
      setSummary(result.data.summary);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("تعذر تحميل تدقيق حوكمة الصور.", "Unable to load the media governance audit."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const issues = useMemo<AuditIssue[]>(() => {
    if (!summary) return [];
    const rows: AuditIssue[] = [];
    if (summary.productsMissingAuthoritative > 0) {
      rows.push({
        id: "missing-authoritative",
        title: t("تغطية المجموعة الاحترافية غير مكتملة", "Professional coverage is incomplete"),
        detail: t(
          `${summary.productsMissingAuthoritative} صنفًا لا يملك مرشحًا من المصدر الاحترافي المعتمد.`,
          `${summary.productsMissingAuthoritative} products have no candidate from the authoritative professional source.`
        )
      });
    }
    if (summary.activeProductsWithoutLiveImages > 0) {
      rows.push({
        id: "active-without-live-image",
        title: t("أصناف نشطة بلا صورة منشورة", "Active products without a live image"),
        detail: t(
          `${summary.activeProductsWithoutLiveImages} صنفًا نشطًا يحتاج صورة منشورة قبل اكتمال الجاهزية البصرية للمنيو.`,
          `${summary.activeProductsWithoutLiveImages} active products need a live image before the menu is visually complete.`
        )
      });
    }
    if (summary.productsWithNoPrimaryImage > 0) {
      rows.push({
        id: "missing-primary",
        title: t("صور منشورة بلا صورة أساسية", "Live images without a primary"),
        detail: t(
          `${summary.productsWithNoPrimaryImage} صنفًا لديه صور منشورة، لكن لم تُعيّن له صورة أساسية.`,
          `${summary.productsWithNoPrimaryImage} products have live images but no primary image.`
        )
      });
    }
    if (summary.productsWithMultiplePrimaryImages > 0) {
      rows.push({
        id: "multiple-primary",
        title: t("تعارض في الصور الأساسية", "Primary-image conflict"),
        detail: t(
          `${summary.productsWithMultiplePrimaryImages} صنفًا لديه أكثر من صورة أساسية ويحتاج تصحيحًا محكومًا.`,
          `${summary.productsWithMultiplePrimaryImages} products have multiple primary images and require a governed correction.`
        )
      });
    }
    return rows;
  }, [summary, t]);

  const activeReady = summary
    ? Math.max(0, summary.activeCatalogProducts - summary.activeProductsWithoutLiveImages)
    : 0;
  const primaryIssues = summary
    ? summary.productsWithNoPrimaryImage + summary.productsWithMultiplePrimaryImages
    : 0;

  return (
    <section
      id="media-governance-audit"
      className="scroll-mt-24 space-y-5 rounded-2xl border border-[var(--border-gold)] bg-[rgba(12,12,12,.92)] p-4 sm:p-6"
      aria-labelledby="media-governance-audit-title"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-[var(--gold-soft)]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            SALORA MEDIA GOVERNANCE
          </p>
          <h3 id="media-governance-audit-title" className="mt-2 text-2xl font-semibold text-[var(--cream)]">
            {t("تدقيق جاهزية صور المنيو", "Menu media readiness audit")}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {t(
              "عرض قراءة فقط يفصل بين عدد الأصناف، سجلات المسودات، الصور المنشورة، وسلامة الصورة الأساسية قبل أي نشر جماعي.",
              "A read-only view that separates product counts, draft records, live images, and primary-image integrity before any bulk publishing."
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
          {t("تحديث التدقيق", "Refresh audit")}
        </button>
      </div>

      {loading ? (
        <div className="grid min-h-36 place-items-center rounded-xl border border-white/10 bg-black/20 text-[var(--muted)]" aria-busy="true">
          <span className="inline-flex items-center gap-2 text-sm">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            {t("جارٍ فحص سلامة الصور…", "Checking media integrity…")}
          </span>
        </div>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("مؤشرات جاهزية الصور", "Media readiness indicators")}>
            {[
              {
                label: t("التغطية الاحترافية", "Professional coverage"),
                value: `${summary.authoritativeProducts}/${summary.catalogProducts}`,
                hint: t("أصناف فريدة من المصدر المعتمد", "unique products from the authoritative source")
              },
              {
                label: t("الأصناف النشطة الجاهزة", "Active products ready"),
                value: `${activeReady}/${summary.activeCatalogProducts}`,
                hint: t("لديها صورة منشورة", "have at least one live image")
              },
              {
                label: t("أصناف بصور منشورة", "Products with live images"),
                value: `${summary.liveImageProducts}/${summary.catalogProducts}`,
                hint: t("عبر كامل كتالوج SALORA", "across the full SALORA catalog")
              },
              {
                label: t("مشكلات الصورة الأساسية", "Primary-image issues"),
                value: primaryIssues,
                hint: t("مفقودة أو متعددة", "missing or duplicated")
              }
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[.025] p-4">
                <p className="text-xs font-semibold text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 font-mono text-2xl font-bold text-[var(--cream)]">{item.value}</p>
                <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{item.hint}</p>
              </div>
            ))}
          </div>

          {issues.length === 0 ? (
            <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">{t("تدقيق الصور سليم", "Media audit is clean")}</p>
                <p className="mt-1 text-sm leading-6 text-emerald-100/80">
                  {t(
                    "التغطية الاحترافية مكتملة، وكل صنف نشط لديه صورة منشورة، ولا توجد تعارضات في الصورة الأساسية.",
                    "Professional coverage is complete, every active product has a live image, and no primary-image conflicts were detected."
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3" aria-label={t("مشكلات تدقيق الصور", "Media audit issues")}>
              {issues.map((issue) => (
                <div key={issue.id} role="status" className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-4 text-amber-100">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">{issue.title}</p>
                    <p className="mt-1 text-sm leading-6 text-amber-100/80">{issue.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {summary.productsWithMultipleLiveImages > 0 ? (
            <p className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-[var(--muted)]">
              <ImageIcon className="h-4 w-4 text-[var(--gold-soft)]" aria-hidden="true" />
              {t(
                `${summary.productsWithMultipleLiveImages} صنفًا لديه أكثر من صورة منشورة؛ هذا مسموح ما دامت صورة أساسية واحدة فقط محددة.`,
                `${summary.productsWithMultipleLiveImages} products have multiple live images; this is valid when exactly one primary is assigned.`
              )}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
