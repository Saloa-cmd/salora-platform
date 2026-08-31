"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpLeft, CheckCircle2, CircleAlert, ExternalLink, ImageIcon, PackageCheck, ReceiptText, Sparkles } from "lucide-react";
import { controlTowerGet } from "@/lib/control-tower/client";
import { useControlTowerLocale } from "./ControlTowerLocale";

type Pulse = {
  generatedAt: string;
  commerce: { productsTotal: number; productsActive: number; productImagesLive: number; mediaDrafts: number; ordersTotal: number; ordersActive: number; netRevenueOmr: number };
  governance: { activityLogs: number; auditLogs: number };
  recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: string }>;
};

type LoadState = { status: "loading" } | { status: "success"; pulse: Pulse } | { status: "error"; message: string };

function HomeSkeleton() {
  return <div className="grid animate-pulse gap-4" aria-label="Loading dashboard"><div className="h-36 rounded-3xl bg-[var(--surface)]" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 rounded-2xl bg-[var(--surface)]" />)}</div></div>;
}

export function ControlTowerHome() {
  const { isArabic } = useControlTowerLocale();
  const copy = (ar: string, en: string) => isArabic ? ar : en;
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void controlTowerGet<Pulse>("/api/control-tower/data-pulse").then((result) => {
      if (!active) return;
      if (result.status === "success" && result.data) setState({ status: "success", pulse: result.data });
      else setState({ status: "error", message: result.message ?? (isArabic ? "تعذر تحميل ملخص اليوم." : "Today's brief could not load.") });
    });
    return () => { active = false; };
  }, [isArabic]);

  const number = useMemo(() => new Intl.NumberFormat(isArabic ? "ar-OM" : "en-OM"), [isArabic]);
  const omr = useMemo(() => new Intl.NumberFormat(isArabic ? "ar-OM" : "en-OM", { style: "currency", currency: "OMR", minimumFractionDigits: 3 }), [isArabic]);
  const date = useMemo(() => new Intl.DateTimeFormat(isArabic ? "ar-OM" : "en-OM", { dateStyle: "medium", timeStyle: "short" }), [isArabic]);

  if (state.status === "loading") return <HomeSkeleton />;
  if (state.status === "error") return <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6" role="status"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 text-amber-300" /><div><h2 className="font-semibold">{copy("تعذر تحميل ملخص اليوم", "Today's brief is unavailable")}</h2><p className="mt-2 text-sm text-[var(--muted)]">{state.message}</p></div></div></section>;

  const pulse = state.pulse;
  const missingProducts = Math.max(pulse.commerce.productsTotal - pulse.commerce.productsActive, 0);
  const attentionCount = missingProducts + pulse.commerce.mediaDrafts;
  const metrics = [
    { icon: PackageCheck, label: copy("أصناف جاهزة", "Ready products"), value: `${number.format(pulse.commerce.productsActive)} / ${number.format(pulse.commerce.productsTotal)}`, detail: copy("ظاهرة للعملاء الآن", "Visible to customers now"), tone: missingProducts ? "warning" : "ok" },
    { icon: ImageIcon, label: copy("صور منشورة", "Published images"), value: number.format(pulse.commerce.productImagesLive), detail: pulse.commerce.mediaDrafts ? copy(`${pulse.commerce.mediaDrafts} بانتظار المراجعة`, `${pulse.commerce.mediaDrafts} awaiting review`) : copy("لا توجد صور معلّقة", "No pending media"), tone: pulse.commerce.mediaDrafts ? "warning" : "ok" },
    { icon: ReceiptText, label: copy("طلبات مفتوحة", "Open orders"), value: number.format(pulse.commerce.ordersActive), detail: copy(`من ${pulse.commerce.ordersTotal} طلبًا مسجلًا`, `From ${pulse.commerce.ordersTotal} recorded orders`), tone: "neutral" },
    { icon: Sparkles, label: copy("صافي الإيراد", "Net revenue"), value: omr.format(pulse.commerce.netRevenueOmr), detail: copy("وفق السجلات المتاحة", "From available records"), tone: "neutral" }
  ] as const;
  const actions = [
    { href: "/control-tower/menu", title: copy("إدارة الأصناف", "Manage products"), detail: copy("السعر، الصورة، التوفر والنشر", "Price, media, availability and publishing"), icon: PackageCheck },
    { href: "/control-tower/experience", title: copy("تعديل الواجهات", "Edit experiences"), detail: copy("الموقع والمنيو والعرض على الهاتف", "Website, menu and mobile presentation"), icon: Sparkles },
    { href: "/menu", title: copy("معاينة المنيو", "Preview menu"), detail: copy("افتح تجربة العميل الحالية", "Open the current customer experience"), icon: ExternalLink, external: true }
  ];

  return <div className="grid gap-5">
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-gold)] bg-[var(--surface)] p-5 sm:p-7"><div className="absolute inset-y-0 end-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(201,164,92,.14),transparent_68%)]" aria-hidden="true" /><div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold text-[var(--success)]"><span className="h-2 w-2 rounded-full bg-[var(--success)]" />{copy("المنصة متصلة", "Platform connected")}</div><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{attentionCount ? copy(`${number.format(attentionCount)} عناصر تحتاج قرارك`, `${number.format(attentionCount)} items need your decision`) : copy("كل شيء هادئ وجاهز", "Everything is calm and ready")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{attentionCount ? copy("ابدأ بالأصناف أو الصور المعلّقة. بقية المنصة تعمل دون تدخل.", "Start with pending products or media. The rest of the platform needs no action.") : copy("لا توجد أعمال عاجلة في الكتالوج أو الصور.", "There are no urgent catalog or media tasks.")}</p></div><Link href="/control-tower/menu" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--gold)] px-5 text-sm font-bold text-[#17120a] transition hover:bg-[var(--gold-soft)]">{copy("ابدأ المعالجة", "Start resolving")}<ArrowUpLeft className="h-4 w-4 rtl:-scale-x-100" /></Link></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={copy("مؤشرات اليوم", "Today's indicators")}>{metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5"><div className="flex items-center justify-between gap-3"><metric.icon className="h-5 w-5 text-[var(--gold-soft)]" /><span className={`h-2 w-2 rounded-full ${metric.tone === "ok" ? "bg-emerald-400" : metric.tone === "warning" ? "bg-amber-400" : "bg-white/25"}`} /></div><p className="mt-5 text-2xl font-semibold tracking-tight">{metric.value}</p><p className="mt-2 text-sm font-medium">{metric.label}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{metric.detail}</p></article>)}</section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]"><article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6"><h2 className="text-lg font-semibold">{copy("ماذا تريد أن تفعل؟", "What do you want to do?")}</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{actions.map((action) => <Link key={action.href} href={action.href} target={action.external ? "_blank" : undefined} rel={action.external ? "noreferrer" : undefined} className="group flex min-h-36 flex-col rounded-2xl border border-[var(--border-subtle)] p-4 transition hover:border-[var(--border-gold)] hover:bg-white/[0.025]"><action.icon className="h-5 w-5 text-[var(--gold-soft)]" /><strong className="mt-auto text-sm">{action.title}</strong><span className="mt-1 text-xs leading-5 text-[var(--muted)]">{action.detail}</span></Link>)}</div></article><article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><h2 className="text-lg font-semibold">{copy("آخر تحديث", "Latest update")}</h2></div><p className="mt-4 text-sm">{date.format(new Date(pulse.generatedAt))}</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{copy(`${number.format(pulse.governance.activityLogs + pulse.governance.auditLogs)} عملية موثقة في سجل المنصة.`, `${number.format(pulse.governance.activityLogs + pulse.governance.auditLogs)} governed events are recorded.`)}</p><details className="mt-5 border-t border-[var(--border-subtle)] pt-4"><summary className="cursor-pointer text-sm font-semibold text-[var(--gold-soft)]">{copy("عرض آخر النشاطات", "Show recent activity")}</summary><div className="mt-3 grid gap-3">{pulse.recentActivity.slice(0, 4).map((item) => <div key={item.id} className="border-s border-[var(--border-gold)] ps-3"><p className="text-xs font-medium">{item.action}</p><time className="mt-1 block text-[10px] text-[var(--muted)]">{date.format(new Date(item.createdAt))}</time></div>)}</div></details></article></section>
  </div>;
}
