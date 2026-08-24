"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, Megaphone, Plus, Power, RefreshCcw } from "lucide-react";
import { controlTowerGet, controlTowerPatch, controlTowerPost } from "@/lib/control-tower/client";
import type { MutationState } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";
import { ContentOperationsStudio } from "./ContentOperationsStudio";

type Promotion = { id: string; slug: string; name: string; description?: string; status: string; priority?: number };
type Coupon = { id: string; code: string; name: string; description?: string; discountType?: string; discountValue?: string | number; isActive: boolean; usageCount?: number };

const initialMutation: MutationState = { status: "idle" };

function Notice({ state }: { state: MutationState }) {
  if (state.status === "idle" || state.status === "submitting") return null;
  return <p className={`rounded-xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-red-300/20 bg-red-300/10 text-red-100"}`}>{state.message}</p>;
}

export function MarketingOperationsWorkspace() {
  const { isArabic } = useControlTowerLocale();
  const t = useCallback((ar: string, en: string) => isArabic ? ar : en, [isArabic]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutation, setMutation] = useState<MutationState>(initialMutation);
  const [promotionForm, setPromotionForm] = useState({ slug: "", name: "", description: "", priority: "0" });
  const [couponForm, setCouponForm] = useState({ code: "", name: "", discountType: "PERCENTAGE", discountValue: "10", minimumOrderTotal: "" });

  const refresh = useCallback(async () => {
    setLoading(true);
    const [promotionResult, couponResult] = await Promise.all([
      controlTowerGet<Promotion[]>("/api/control-tower/simple-launch/promotions"),
      controlTowerGet<Coupon[]>("/api/control-tower/simple-launch/coupons")
    ]);
    if (promotionResult.data) setPromotions(promotionResult.data);
    if (couponResult.data) setCoupons(couponResult.data);
    if (promotionResult.status === "error") setMutation(promotionResult);
    else if (couponResult.status === "error") setMutation(couponResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const activePromotions = useMemo(() => promotions.filter((item) => item.status === "ACTIVE").length, [promotions]);
  const activeCoupons = useMemo(() => coupons.filter((item) => item.isActive).length, [coupons]);
  const redemptions = useMemo(() => coupons.reduce((sum, item) => sum + (item.usageCount ?? 0), 0), [coupons]);

  async function createPromotion() {
    if (!promotionForm.slug.trim() || !promotionForm.name.trim()) return;
    setMutation({ status: "submitting", message: t("جارٍ إنشاء العرض...", "Creating promotion...") });
    const result = await controlTowerPost("/api/control-tower/simple-launch/promotions", {
      action: "create",
      slug: promotionForm.slug.trim(),
      name: promotionForm.name.trim(),
      description: promotionForm.description.trim() || undefined,
      status: "DRAFT",
      priority: Number(promotionForm.priority || 0),
      rules: {}
    });
    setMutation(result);
    if (result.status === "success") {
      setPromotionForm({ slug: "", name: "", description: "", priority: "0" });
      await refresh();
    }
  }

  async function setPromotionStatus(promotion: Promotion, status: string) {
    setMutation({ status: "submitting", message: t("جارٍ تحديث حالة العرض...", "Updating promotion status...") });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/promotions", { action: "status", slug: promotion.slug, status });
    setMutation(result);
    if (result.status === "success") await refresh();
  }

  async function expirePromotion(promotion: Promotion) {
    setMutation({ status: "submitting", message: t("جارٍ إنهاء العرض...", "Expiring promotion...") });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/promotions", { action: "expire", slug: promotion.slug });
    setMutation(result);
    if (result.status === "success") await refresh();
  }

  async function createCoupon() {
    if (!couponForm.code.trim() || !couponForm.name.trim()) return;
    setMutation({ status: "submitting", message: t("جارٍ إنشاء القسيمة...", "Creating coupon...") });
    const result = await controlTowerPost("/api/control-tower/simple-launch/coupons", {
      action: "create",
      code: couponForm.code.trim().toUpperCase(),
      name: couponForm.name.trim(),
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      minimumOrderTotal: couponForm.minimumOrderTotal ? Number(couponForm.minimumOrderTotal) : undefined
    });
    setMutation(result);
    if (result.status === "success") {
      setCouponForm({ code: "", name: "", discountType: "PERCENTAGE", discountValue: "10", minimumOrderTotal: "" });
      await refresh();
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    setMutation({ status: "submitting", message: t("جارٍ تحديث القسيمة...", "Updating coupon...") });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/coupons", { action: "toggle", code: coupon.code, isActive: !coupon.isActive });
    setMutation(result);
    if (result.status === "success") await refresh();
  }

  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-3">
      {[
        [t("العروض النشطة", "Active promotions"), activePromotions, t(`${promotions.length} إجمالي`, `${promotions.length} total`)],
        [t("القسائم النشطة", "Active coupons"), activeCoupons, t(`${coupons.length} إجمالي`, `${coupons.length} total`)],
        [t("مرات استخدام القسائم", "Coupon redemptions"), redemptions, t("من سجلات الاستخدام الفعلية", "From observed redemption records")]
      ].map(([label, value, detail]) => <article key={String(label)} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-3 text-2xl font-semibold text-[var(--cream)]">{value}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{detail}</p></article>)}
    </section>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[var(--gold-soft)]">SALORA MARKETING OPS</p><h3 className="mt-2 text-xl font-semibold text-[var(--cream)]">{t("العروض والقسائم", "Promotions & coupons")}</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t("إدارة مباشرة محكومة بالصلاحيات وسجل التدقيق، دون تعديل الكود.", "Permission-scoped operations with audit logging and no code edits.")}</p></div>
      <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-[var(--muted)] hover:border-[var(--border-gold)] hover:text-[var(--cream)] disabled:opacity-50"><RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />{t("تحديث", "Refresh")}</button>
    </div>

    <Notice state={mutation} />

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--gold)]/10 text-[var(--gold-soft)]"><Megaphone className="size-5" /></span><div><h4 className="font-semibold text-[var(--cream)]">{t("إدارة العروض", "Promotion manager")}</h4><p className="text-xs text-[var(--muted)]">{t("Draft → Approved → Active → Expired", "Draft → Approved → Active → Expired")}</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input value={promotionForm.name} onChange={(event) => setPromotionForm((current) => ({ ...current, name: event.target.value }))} placeholder={t("اسم العرض", "Promotion name")} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)]" />
          <input dir="ltr" value={promotionForm.slug} onChange={(event) => setPromotionForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))} placeholder="summer-offer" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)]" />
          <input value={promotionForm.description} onChange={(event) => setPromotionForm((current) => ({ ...current, description: event.target.value }))} placeholder={t("وصف مختصر", "Short description")} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)] sm:col-span-2" />
          <input type="number" value={promotionForm.priority} onChange={(event) => setPromotionForm((current) => ({ ...current, priority: event.target.value }))} placeholder={t("الأولوية", "Priority")} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)]" />
          <button type="button" onClick={() => void createPromotion()} disabled={mutation.status === "submitting" || !promotionForm.name || !promotionForm.slug} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40"><Plus className="size-4" />{t("إنشاء كمسودة", "Create draft")}</button>
        </div>
        <div className="mt-5 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          {promotions.length ? promotions.map((promotion) => <div key={promotion.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[var(--cream)]">{promotion.name}</strong><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-[var(--muted)]">{promotion.status}</span></div><p className="mt-1 text-xs text-[var(--muted)]">{promotion.slug}</p></div><div className="flex flex-wrap gap-2"><select value={promotion.status} onChange={(event) => void setPromotionStatus(promotion, event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-xs text-[var(--cream)]">{["DRAFT", "APPROVED", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"].map((status) => <option key={status}>{status}</option>)}</select><button type="button" onClick={() => void expirePromotion(promotion)} disabled={promotion.status === "EXPIRED"} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[var(--muted)] disabled:opacity-40">{t("إنهاء", "Expire")}</button></div></div>) : <p className="py-6 text-center text-xs text-[var(--muted)]">{t("لا توجد عروض بعد.", "No promotions yet.")}</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--gold)]/10 text-[var(--gold-soft)]"><BadgePercent className="size-5" /></span><div><h4 className="font-semibold text-[var(--cream)]">{t("إدارة القسائم", "Coupon manager")}</h4><p className="text-xs text-[var(--muted)]">{t("خصومات محكومة بحد 25٪ للنسبة دون بوابة موافقة إضافية.", "Percentage discounts are capped at 25% without a separate approval gate.")}</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input dir="ltr" value={couponForm.code} onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/\s/g, "") }))} placeholder="SALORA10" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)]" />
          <input value={couponForm.name} onChange={(event) => setCouponForm((current) => ({ ...current, name: event.target.value }))} placeholder={t("اسم القسيمة", "Coupon name")} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)]" />
          <select value={couponForm.discountType} onChange={(event) => setCouponForm((current) => ({ ...current, discountType: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)]"><option value="PERCENTAGE">PERCENTAGE</option><option value="FIXED_AMOUNT">FIXED_AMOUNT</option><option value="FREE_ITEM">FREE_ITEM</option></select>
          <input type="number" min="0" step="0.001" value={couponForm.discountValue} onChange={(event) => setCouponForm((current) => ({ ...current, discountValue: event.target.value }))} placeholder={t("قيمة الخصم", "Discount value")} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)]" />
          <input type="number" min="0" step="0.001" value={couponForm.minimumOrderTotal} onChange={(event) => setCouponForm((current) => ({ ...current, minimumOrderTotal: event.target.value }))} placeholder={t("الحد الأدنى للطلب - اختياري", "Minimum order - optional")} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-[var(--cream)]" />
          <button type="button" onClick={() => void createCoupon()} disabled={mutation.status === "submitting" || !couponForm.code || !couponForm.name || !couponForm.discountValue} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40"><Plus className="size-4" />{t("إنشاء القسيمة", "Create coupon")}</button>
        </div>
        <div className="mt-5 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          {coupons.length ? coupons.map((coupon) => <div key={coupon.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm text-[var(--cream)]">{coupon.code}</strong><span className={`rounded-full border px-2 py-1 text-[10px] ${coupon.isActive ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-white/10 text-[var(--muted)]"}`}>{coupon.isActive ? t("نشطة", "ACTIVE") : t("متوقفة", "INACTIVE")}</span></div><p className="mt-1 text-xs text-[var(--muted)]">{coupon.name} · {coupon.usageCount ?? 0} {t("استخدام", "uses")}</p></div><button type="button" onClick={() => void toggleCoupon(coupon)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-[var(--muted)] hover:border-[var(--border-gold)] hover:text-[var(--cream)]"><Power className="size-3.5" />{coupon.isActive ? t("إيقاف", "Disable") : t("تفعيل", "Enable")}</button></div>) : <p className="py-6 text-center text-xs text-[var(--muted)]">{t("لا توجد قسائم بعد.", "No coupons yet.")}</p>}
        </div>
      </section>
    </div>

    <ContentOperationsStudio />
  </div>;
}
