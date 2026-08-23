"use client";

import { useEffect, useMemo, useState } from "react";
import { controlTowerGet } from "@/lib/control-tower/client";
import { useControlTowerLocale } from "./ControlTowerLocale";

type Pulse = {
  generatedAt: string;
  source: "postgresql-rls";
  commerce: {
    productsTotal: number;
    productsActive: number;
    productImagesLive: number;
    imageCoveragePercent: number;
    mediaDrafts: number;
    ordersTotal: number;
    ordersActive: number;
    paymentsTotal: number;
    successfulPayments: number;
    paymentSuccessPercent: number;
    grossRevenueOmr: number;
    refundedAmountOmr: number;
    netRevenueOmr: number;
  };
  engagement: { conversations: number };
  ai: { evaluations: number; recommendations: number; observedRecords: number };
  governance: {
    cmsDocuments: number;
    enabledFeatureFlags: number;
    activeRuntimeConfigs: number;
    activityLogs: number;
    auditLogs: number;
  };
  recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: string }>;
};

type LoadState =
  | { status: "loading" }
  | { status: "success"; pulse: Pulse }
  | { status: "error"; message: string };

export function ControlTowerDataPulse() {
  const { isArabic } = useControlTowerLocale();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const copy = (ar: string, en: string) => isArabic ? ar : en;

  useEffect(() => {
    let active = true;
    void controlTowerGet<Pulse>("/api/control-tower/data-pulse").then((result) => {
      if (!active) return;
      if (result.status === "success" && result.data) setState({ status: "success", pulse: result.data });
      else setState({ status: "error", message: result.message ?? (isArabic ? "تعذر تحميل نبض البيانات." : "The database pulse could not load.") });
    });
    return () => { active = false; };
  }, [isArabic]);

  const number = useMemo(() => new Intl.NumberFormat(isArabic ? "ar-OM" : "en-OM"), [isArabic]);
  const omr = useMemo(() => new Intl.NumberFormat(isArabic ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 3, maximumFractionDigits: 3 }), [isArabic]);
  const date = useMemo(() => new Intl.DateTimeFormat(isArabic ? "ar-OM" : "en-OM", { dateStyle: "medium", timeStyle: "short" }), [isArabic]);

  if (state.status === "loading") {
    return <section className="grid animate-pulse gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label={copy("تحميل البيانات الفعلية", "Loading authoritative data")}>
      {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-32 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]" />)}
    </section>;
  }

  if (state.status === "error") {
    return <section className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-5" role="status">
      <p className="text-sm font-semibold">{copy("نبض قاعدة البيانات غير متاح", "Database pulse unavailable")}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{state.message}</p>
    </section>;
  }

  const pulse = state.pulse;
  const metrics = [
    {
      label: copy("الأصناف النشطة", "Active products"),
      value: `${number.format(pulse.commerce.productsActive)} / ${number.format(pulse.commerce.productsTotal)}`,
      detail: copy("من كتالوج SALORA الفعلي", "From the live SALORA catalog")
    },
    {
      label: copy("تغطية الصور", "Image coverage"),
      value: `${number.format(pulse.commerce.imageCoveragePercent)}%`,
      detail: copy(`${pulse.commerce.productImagesLive} صورة منشورة`, `${pulse.commerce.productImagesLive} live images`)
    },
    {
      label: copy("الطلبات النشطة", "Active orders"),
      value: `${number.format(pulse.commerce.ordersActive)} / ${number.format(pulse.commerce.ordersTotal)}`,
      detail: copy("حالة الطلبات من PostgreSQL", "Order state from PostgreSQL")
    },
    {
      label: copy("صافي الإيراد المرصود", "Observed net revenue"),
      value: omr.format(pulse.commerce.netRevenueOmr),
      detail: copy(`نجاح الدفع ${pulse.commerce.paymentSuccessPercent}%`, `${pulse.commerce.paymentSuccessPercent}% payment success`)
    },
    {
      label: copy("سجلات الذكاء الاصطناعي", "AI records"),
      value: number.format(pulse.ai.observedRecords),
      detail: copy(`${pulse.ai.recommendations} توصية · ${pulse.ai.evaluations} تقييم`, `${pulse.ai.recommendations} recommendations · ${pulse.ai.evaluations} evaluations`)
    },
    {
      label: copy("أحداث الحوكمة", "Governance events"),
      value: number.format(pulse.governance.activityLogs + pulse.governance.auditLogs),
      detail: copy(`${pulse.governance.enabledFeatureFlags} ميزات مفعلة · ${pulse.governance.activeRuntimeConfigs} إعدادات`, `${pulse.governance.enabledFeatureFlags} enabled flags · ${pulse.governance.activeRuntimeConfigs} configs`)
    }
  ];

  return <section className="grid gap-4" aria-labelledby="authoritative-data-pulse-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">POSTGRESQL · RLS</p>
        </div>
        <h2 id="authoritative-data-pulse-title" className="mt-2 text-xl font-semibold">{copy("نبض البيانات المعتمد", "Authoritative data pulse")}</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{copy("أرقام مجمعة من قاعدة البيانات الفعلية، دون بيانات شخصية أو أسرار.", "Aggregate figures from the real database, with no PII or secrets exposed.")}</p>
      </div>
      <span className="text-[11px] text-[var(--muted)]">{date.format(new Date(pulse.generatedAt))}</span>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric) => <article key={metric.label} className="min-h-32 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 transition hover:border-[var(--border-gold)]">
        <p className="text-xs text-[var(--muted)]">{metric.label}</p>
        <p className="mt-4 text-xl font-semibold tracking-tight text-[var(--cream)]">{metric.value}</p>
        <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{metric.detail}</p>
      </article>)}
    </div>

    <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">{copy("آخر النشاطات الموثقة", "Recent governed activity")}</h3>
          <p className="mt-1 text-[11px] text-[var(--muted)]">{copy("لا يتم عرض metadata أو معلومات العملاء هنا.", "Metadata and customer information are intentionally excluded.")}</p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[var(--muted)]">{number.format(pulse.governance.activityLogs)}</span>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {pulse.recentActivity.length ? pulse.recentActivity.slice(0, 6).map((item) => <div key={item.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
          <div className="min-w-0"><p className="truncate text-xs font-medium text-[var(--cream)]">{item.action}</p><p className="mt-1 truncate text-[10px] text-[var(--muted)]">{item.entityType}</p></div>
          <time className="text-[10px] text-[var(--muted)]" dateTime={item.createdAt}>{date.format(new Date(item.createdAt))}</time>
        </div>) : <p className="px-5 py-6 text-xs text-[var(--muted)]">{copy("لا توجد نشاطات مرصودة.", "No governed activity has been observed.")}</p>}
      </div>
    </article>
  </section>;
}
