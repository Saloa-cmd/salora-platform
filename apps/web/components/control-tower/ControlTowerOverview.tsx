"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getExecutiveDashboard } from "@/lib/dashboard/executiveAdapter";
import type { DashboardResult, DashboardStatus, ExecutiveDashboardData, TrendPoint } from "@/lib/dashboard/types";
import { SaloraIcon, type SaloraIconName } from "@/components/ui/SaloraIcon";
import { useControlTowerLocale } from "./ControlTowerLocale";

const statusTone: Record<DashboardStatus, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-400",
  critical: "bg-red-500",
  empty: "bg-zinc-400",
  unauthorized: "bg-red-500",
  error: "bg-red-500"
};

const arabicLabels: Record<string, string> = {
  "Total revenue": "إجمالي الإيرادات",
  "Active orders": "الطلبات النشطة",
  "Payment success": "نجاح المدفوعات",
  "AI request volume": "طلبات الذكاء الاصطناعي",
  "Operations": "التشغيل",
  "Inventory": "المخزون",
  "AI": "الذكاء الاصطناعي"
};

function Sparkline({ points }: { points: TrendPoint[] }) {
  if (!points.length) return null;
  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 38 - ((point.value - min) / range) * 30;
    return `${x},${y}`;
  }).join(" ");

  return <div className="mt-5" aria-label="Revenue trend">
    <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="h-52 w-full overflow-visible" role="img">
      {[8, 18, 28, 38].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" className="text-[var(--border-subtle)]" vectorEffect="non-scaling-stroke" />)}
      <polyline points={coordinates} fill="none" stroke="var(--gold)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {coordinates.split(" ").map((point) => { const [cx, cy] = point.split(","); return <circle key={point} cx={cx} cy={cy} r="1.15" fill="var(--gold)" vectorEffect="non-scaling-stroke" />; })}
    </svg>
    <div className="mt-2 flex justify-between text-[10px] text-[var(--muted)]">{points.map((point) => <span key={point.label}>{point.label}</span>)}</div>
  </div>;
}

function LoadingOverview() {
  return <div className="grid animate-pulse gap-5" aria-label="Loading dashboard">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-36 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]" />)}</div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.75fr)]"><div className="h-80 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]" /><div className="h-80 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]" /></div>
  </div>;
}

export function ControlTowerOverview() {
  const { isArabic } = useControlTowerLocale();
  const [result, setResult] = useState<DashboardResult<ExecutiveDashboardData> | null>(null);
  const copy = (ar: string, en: string) => isArabic ? ar : en;

  useEffect(() => {
    let active = true;
    void getExecutiveDashboard().then((next) => { if (active) setResult(next); });
    return () => { active = false; };
  }, []);

  if (!result) return <LoadingOverview />;

  if (!result.data) {
    return <section className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-6" role="status">
      <p className="text-sm font-semibold text-[var(--cream)]">{copy("تعذر تحميل الملخص التشغيلي", "The operational brief could not load")}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy("لم يتم اختلاق أرقام بديلة. راجع صلاحية الجلسة وحالة واجهات الذكاء.", "No fallback numbers were invented. Check the session and intelligence APIs.")}</p>
      <p className="mt-3 text-xs text-[var(--muted)]">{result.message}</p>
    </section>;
  }

  const data = result.data;
  const metrics = data.metrics.slice(0, 4);
  const alerts = data.alerts.slice(0, 4);
  const shortcuts: Array<{ href: string; icon: SaloraIconName; label: string }> = [
    { href: "/control-tower/experience", icon: "pages", label: copy("مراجعة التجربة المنشورة", "Review published experience") },
    { href: "/control-tower/orders", icon: "orders", label: copy("فتح عمليات الطلبات", "Open order operations") },
    { href: "/control-tower/menu", icon: "menu", label: copy("مراجعة القائمة والأصناف", "Review menu and products") }
  ];
  return <div className="grid gap-5">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={copy("مؤشرات اليوم", "Today's indicators")}>
      {metrics.map((metric) => <article key={metric.label} className="min-h-36 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <div className="flex items-start justify-between gap-4"><p className="text-sm text-[var(--muted)]">{isArabic ? (arabicLabels[metric.label] ?? metric.label) : metric.label}</p><span className={`mt-1 h-2 w-2 rounded-full ${statusTone[metric.status ?? "empty"]}`} /></div>
        <p className="mt-5 text-2xl font-semibold tracking-tight text-[var(--cream)] sm:text-3xl">{metric.value}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">{metric.detail}</p>
      </article>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.75fr)]">
      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">{copy("اتجاه الإيرادات", "Revenue direction")}</h2><p className="mt-1 text-xs text-[var(--muted)]">{copy("بيانات من واجهة الذكاء التنفيذي", "Backed by the executive intelligence API")}</p></div><span className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--muted)]">{copy("آخر 5 نقاط", "Last 5 points")}</span></div>
        <Sparkline points={data.revenueTrend} />
      </article>
      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border-subtle)] p-5"><h2 className="text-lg font-semibold">{copy("حالة التشغيل", "Operational health")}</h2><p className="mt-1 text-xs text-[var(--muted)]">{data.generatedAt ? new Intl.DateTimeFormat(isArabic ? "ar-OM" : "en-OM", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt)) : copy("تحديث مباشر", "Live refresh")}</p></div>
        <div className="divide-y divide-[var(--border-subtle)]">{data.runtime.map((item) => <div key={item.label} className="flex items-start gap-3 p-5"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusTone[item.status]}`} /><div className="min-w-0"><p className="text-sm font-semibold">{isArabic ? (arabicLabels[item.label] ?? item.label) : item.label}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.detail}</p></div></div>)}</div>
      </article>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{copy("إجراءات تتطلب الانتباه", "Needs attention")}</h2><span className="grid h-7 min-w-7 place-items-center rounded-full bg-[var(--gold)]/15 px-2 text-xs font-semibold text-[var(--gold-soft)]">{alerts.length}</span></div>
        <div className="mt-4 divide-y divide-[var(--border-subtle)]">{alerts.length ? alerts.map((alert) => <div key={alert.id} className="flex items-start gap-3 py-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.severity === "critical" ? "bg-red-500" : alert.severity === "warning" ? "bg-amber-400" : "bg-sky-400"}`} /><div><p className="text-sm font-medium">{alert.title}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{alert.detail}</p></div></div>) : <p className="py-6 text-sm text-[var(--muted)]">{copy("لا توجد تنبيهات تشغيلية معلنة.", "No operational alerts are currently reported.")}</p>}</div>
      </article>
      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{copy("اختصارات العمل", "Work shortcuts")}</h2>
        <div className="mt-4 grid gap-2">{shortcuts.map((shortcut) => <Link key={shortcut.href} href={shortcut.href} className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--border-subtle)] px-3 text-sm transition hover:border-[var(--border-gold)] hover:bg-white/[0.025]"><SaloraIcon name={shortcut.icon} className="h-4 w-4 text-[var(--gold-soft)]" /><span className="flex-1">{shortcut.label}</span><SaloraIcon name="forward" className="h-4 w-4 text-[var(--muted)]" /></Link>)}</div>
      </article>
    </section>
  </div>;
}
