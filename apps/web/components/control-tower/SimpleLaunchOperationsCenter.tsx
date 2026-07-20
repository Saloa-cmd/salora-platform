"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { RuntimeStatusCard } from "@/components/dashboard/RuntimeStatusCard";
import { controlTowerGet, controlTowerPatch, controlTowerPost } from "@/lib/control-tower/client";
import type { MutationState } from "@/lib/control-tower/types";
import { Plus, Trash2 } from "lucide-react";
import { useControlTowerLocale } from "./ControlTowerLocale";

type CategoryRow = { id: string; slug: string; name: string; sortOrder: number; _count?: { products: number } };
type ProductRow = { id: string; slug: string; name: string; nameAr?: string; nameEn?: string; description?: string; descriptionAr?: string; descriptionEn?: string; status: string; basePrice: string | number; category?: { name: string }; images?: Array<{ id: string; publicUrl?: string; isPrimary: boolean }>; variants?: Array<{ name: string; priceDelta: string | number; sku?: string }>; addons?: Array<{ name: string; price: string | number }>; modifiers?: Array<{ name: string; required: boolean; options: unknown }> };
type CouponRow = { id: string; code: string; name: string; isActive: boolean; usageCount?: number };
type PromotionRow = { id: string; slug: string; name: string; status: string };
type FeatureFlagRow = { id: string; key: string; environment: string; enabled: boolean };
type LogRow = { id: string; action?: string; entityType: string; requestId?: string; createdAt: string };
type VariantEditor = { name: string; priceDelta: string; sku: string };
type AddonEditor = { name: string; price: string };
type ModifierEditor = { name: string; required: boolean; optionsText: string };

const initialState: MutationState = { status: "idle" };

function ConfigurationSection({ title, addLabel, onAdd, children }: { title: string; addLabel: string; onAdd: () => void; children: ReactNode }) {
  return <section className="grid gap-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[var(--cream)]">{title}</h3><button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-gold)] px-3 py-2 text-xs font-semibold text-[var(--gold-soft)]"><Plus className="h-3.5 w-3.5" aria-hidden="true" />{addLabel}</button></div>{children}</section>;
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-300/15 text-red-200 hover:bg-red-300/10"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>;
}

function ResultNotice({ state }: { state: MutationState }) {
  if (state.status === "idle" || state.status === "submitting") return null;
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${state.status === "success" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-red-300/25 bg-red-300/10 text-red-100"}`}>
      {state.message}
      {state.requestId ? <span className="mt-1 block font-mono text-xs opacity-80">Request ID: {state.requestId}</span> : null}
    </p>
  );
}

export function SimpleLaunchOperationsCenter() {
  const { isArabic } = useControlTowerLocale();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [activityLogs, setActivityLogs] = useState<LogRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<LogRow[]>([]);
  const [state, setState] = useState(initialState);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [imageUrl, setImageUrl] = useState("");
  const [aiOperation, setAiOperation] = useState("description");
  const [aiDraft, setAiDraft] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [variants, setVariants] = useState<VariantEditor[]>([]);
  const [addons, setAddons] = useState<AddonEditor[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierEditor[]>([]);

  function loadProductIntoEditor(product: ProductRow) {
    setNameAr(product.nameAr ?? "");
    setNameEn(product.nameEn ?? product.name);
    setDescriptionAr(product.descriptionAr ?? "");
    setDescriptionEn(product.descriptionEn ?? product.description ?? "");
    setPrice(String(product.basePrice));
    setStatus(product.status);
    setVariants(product.variants?.map((item) => ({ name: item.name, priceDelta: String(item.priceDelta), sku: item.sku ?? "" })) ?? []);
    setAddons(product.addons?.map((item) => ({ name: item.name, price: String(item.price) })) ?? []);
    setModifierGroups(product.modifiers?.map((item) => ({ name: item.name, required: item.required, optionsText: Array.isArray(item.options) ? item.options.map(String).join("، ") : "" })) ?? []);
  }

  const refresh = useCallback(async () => {
    const [productResult, categoryResult, couponResult, promotionResult, flagResult, activityResult, auditResult] = await Promise.all([
      controlTowerGet<ProductRow[]>("/api/control-tower/simple-launch/products"),
      controlTowerGet<CategoryRow[]>("/api/control-tower/simple-launch/categories"),
      controlTowerGet<CouponRow[]>("/api/control-tower/simple-launch/coupons"),
      controlTowerGet<PromotionRow[]>("/api/control-tower/simple-launch/promotions"),
      controlTowerGet<FeatureFlagRow[]>("/api/control-tower/simple-launch/feature-flags"),
      controlTowerGet<LogRow[]>("/api/control-tower/simple-launch/activity-logs"),
      controlTowerGet<LogRow[]>("/api/control-tower/simple-launch/audit-logs")
    ]);
    if (productResult.data) {
      setProducts(productResult.data);
      const product = productResult.data.find((item) => item.slug === selectedSlug) ?? productResult.data[0];
      if (product) {
        setSelectedSlug(product.slug);
        loadProductIntoEditor(product);
      }
    }
    if (categoryResult.data) setCategories(categoryResult.data);
    if (couponResult.data) setCoupons(couponResult.data);
    if (promotionResult.data) setPromotions(promotionResult.data);
    if (flagResult.data) setFlags(flagResult.data);
    if (activityResult.data) setActivityLogs(activityResult.data);
    if (auditResult.data) setAuditLogs(auditResult.data);
  }, [selectedSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const selectedProduct = useMemo(() => products.find((product) => product.slug === selectedSlug), [products, selectedSlug]);
  const missingImages = products.filter((product) => !product.images?.length).length;
  const aiFlags = flags.filter((flag) => /ai|concierge|recommend|pairing|loyalty/i.test(flag.key));
  const enabledAiFlags = aiFlags.filter((flag) => flag.enabled).length;

  async function updatePrice() {
    setState({ status: "submitting", message: "Updating price..." });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/products", { action: "price", slug: selectedSlug, basePrice: Number(price) });
    setState(result);
    await refresh();
  }

  async function updateStatus() {
    setState({ status: "submitting", message: "Updating status..." });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/products", { action: "status", slug: selectedSlug, status });
    setState(result);
    await refresh();
  }

  async function updateBilingualContent() {
    if (!selectedProduct) return;
    setState({ status: "submitting", message: "Saving bilingual catalog content..." });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/products", {
      action: "update",
      slug: selectedProduct.slug,
      name: nameEn,
      nameAr,
      nameEn,
      description: descriptionEn,
      descriptionAr,
      descriptionEn
    });
    setState(result);
    await refresh();
  }

  async function saveConfiguration() {
    if (!selectedProduct) return;
    setState({ status: "submitting", message: isArabic ? "جارٍ حفظ الأحجام والإضافات والخيارات..." : "Saving variants, add-ons, and modifiers..." });
    const result = await controlTowerPost("/api/control-tower/simple-launch/product-configuration", {
      productSlug: selectedProduct.slug,
      variants: variants.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), priceDelta: Number(item.priceDelta || 0), sku: item.sku.trim() || undefined })),
      addons: addons.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), price: Number(item.price || 0) })),
      modifierGroups: modifierGroups.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), required: item.required, options: item.optionsText.split(/[،,]/).map((option) => option.trim()).filter(Boolean) }))
    });
    setState(result);
    await refresh();
  }

  async function addImage() {
    setState({ status: "submitting", message: "Adding image URL..." });
    const result = await controlTowerPost("/api/control-tower/simple-launch/product-images", { action: "add", productSlug: selectedSlug, publicUrl: imageUrl, isPrimary: true });
    setState(result);
    setImageUrl("");
    await refresh();
  }

  async function toggleFlag(flag: FeatureFlagRow) {
    setState({ status: "submitting", message: "Toggling feature flag..." });
    const result = await controlTowerPatch("/api/control-tower/simple-launch/feature-flags", { key: flag.key, environment: flag.environment, enabled: !flag.enabled });
    setState(result);
    await refresh();
  }

  async function generateDraft() {
    if (!selectedProduct) return;
    setState({ status: "submitting", message: "Generating AI draft..." });
    const result = await controlTowerPost<{ draft?: { answer?: string } }>("/api/control-tower/simple-launch/ai-product-tools", {
      operation: aiOperation,
      productSlug: selectedProduct.slug,
      productName: selectedProduct.name,
      category: selectedProduct.category?.name
    });
    setState(result);
    setAiDraft(result.data?.draft?.answer ?? "");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <DashboardGrid columns="two">
        <RuntimeStatusCard title={isArabic ? "بيانات الإطلاق" : "Simple Launch Data"} statuses={[
          { label: isArabic ? "الأصناف" : "Products", status: products.length >= 94 ? "ok" : "warning", detail: isArabic ? `${products.length} صنفًا ظاهرًا في منصة التحكم` : `${products.length} products visible to Control Tower` },
          { label: isArabic ? "الفئات" : "Categories", status: categories.length ? "ok" : "warning", detail: isArabic ? `${categories.length} فئة` : `${categories.length} categories` },
          { label: isArabic ? "الصور الناقصة" : "Image gaps", status: missingImages ? "warning" : "ok", detail: isArabic ? `${missingImages} صنفًا دون صور` : `${missingImages} products without images` },
          { label: isArabic ? "العروض" : "Offers", status: promotions.length || coupons.length ? "ok" : "warning", detail: isArabic ? `${promotions.length} عرضًا و${coupons.length} قسيمة` : `${promotions.length} promotions, ${coupons.length} coupons` }
        ]} />
        <DashboardCard title={isArabic ? "إدارة الأصناف" : "Product Operator"} eyebrow={isArabic ? "متصل بقاعدة البيانات" : "DB-backed"}>
          <div className="grid gap-3">
            <select value={selectedSlug} onChange={(event) => {
              const product = products.find((item) => item.slug === event.target.value);
              if (product) {
                setSelectedSlug(product.slug);
                loadProductIntoEditor(product);
              }
            }} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
              {products.map((product) => <option key={product.id} value={product.slug}>{product.name}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder={isArabic ? "السعر بالريال العُماني" : "OMR price"} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
              <button type="button" onClick={updatePrice} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black">{isArabic ? "تحديث السعر" : "Update price"}</button>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
                {["ACTIVE", "PAUSED", "ARCHIVED", "DRAFT"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <button type="button" onClick={updateStatus} className="rounded-lg border border-[var(--border-gold)] px-4 py-2 text-sm font-semibold text-[var(--gold-soft)]">{isArabic ? "حفظ الحالة" : "Set status"}</button>
              <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder={isArabic ? "رابط الصورة المعتمدة" : "Approved image URL"} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)] sm:col-span-2" />
              <button type="button" onClick={addImage} className="rounded-lg border border-[var(--border-gold)] px-4 py-2 text-sm font-semibold text-[var(--gold-soft)]">{isArabic ? "إضافة الصورة" : "Add image"}</button>
            </div>
            <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
              <input value={nameAr} dir="rtl" onChange={(event) => setNameAr(event.target.value)} placeholder="الاسم بالعربية" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
              <input value={nameEn} onChange={(event) => setNameEn(event.target.value)} placeholder="English name" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
              <textarea value={descriptionAr} dir="rtl" onChange={(event) => setDescriptionAr(event.target.value)} placeholder="الوصف بالعربية" rows={4} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
              <textarea value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} placeholder="English description" rows={4} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
              <button type="button" onClick={updateBilingualContent} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black sm:col-span-2">{isArabic ? "حفظ المحتوى باللغتين" : "Save bilingual content"}</button>
            </div>
            <ResultNotice state={state} />
          </div>
        </DashboardCard>
      </DashboardGrid>

      <DashboardGrid columns="two">
        <DashboardCard title={isArabic ? "تخصيص الصنف" : "Product Configuration"} eyebrow={isArabic ? "الأحجام · الإضافات · الخيارات" : "Variants · Add-ons · Modifiers"}>
          <div className="grid gap-5">
            <p className="text-xs leading-5 text-[var(--muted)]">{isArabic ? "أضف الأحجام والإضافات ومجموعات الخيارات من الحقول التالية. يتم الحفظ بأمان وتسجيل العملية في سجل التدقيق." : "Manage variants, add-ons and modifier groups visually. Changes are validated, saved atomically and audited."}</p>
            <ConfigurationSection title={isArabic ? "الأحجام والأنواع" : "Variants"} onAdd={() => setVariants((items) => [...items, { name: "", priceDelta: "0", sku: "" }])} addLabel={isArabic ? "إضافة حجم" : "Add variant"}>
              {variants.map((item, index) => <div key={`variant-${index}`} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_0.7fr_1fr_auto]"><input aria-label={isArabic ? "اسم الحجم" : "Variant name"} placeholder={isArabic ? "الاسم، مثال: كبير" : "Name, e.g. Large"} value={item.name} onChange={(event) => setVariants((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--cream)]" /><input type="number" step="0.001" aria-label={isArabic ? "فرق السعر" : "Price delta"} placeholder={isArabic ? "فرق السعر" : "Price delta"} value={item.priceDelta} onChange={(event) => setVariants((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, priceDelta: event.target.value } : row))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--cream)]" /><input aria-label="SKU" placeholder="SKU" value={item.sku} onChange={(event) => setVariants((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, sku: event.target.value } : row))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--cream)]" /><RemoveButton label={isArabic ? "حذف الحجم" : "Remove variant"} onClick={() => setVariants((items) => items.filter((_, rowIndex) => rowIndex !== index))} /></div>)}
            </ConfigurationSection>
            <ConfigurationSection title={isArabic ? "الإضافات" : "Add-ons"} onAdd={() => setAddons((items) => [...items, { name: "", price: "0" }])} addLabel={isArabic ? "إضافة خيار" : "Add add-on"}>
              {addons.map((item, index) => <div key={`addon-${index}`} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_0.7fr_auto]"><input placeholder={isArabic ? "اسم الإضافة" : "Add-on name"} value={item.name} onChange={(event) => setAddons((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--cream)]" /><input type="number" step="0.001" placeholder={isArabic ? "السعر" : "Price"} value={item.price} onChange={(event) => setAddons((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--cream)]" /><RemoveButton label={isArabic ? "حذف الإضافة" : "Remove add-on"} onClick={() => setAddons((items) => items.filter((_, rowIndex) => rowIndex !== index))} /></div>)}
            </ConfigurationSection>
            <ConfigurationSection title={isArabic ? "مجموعات الخيارات" : "Modifier groups"} onAdd={() => setModifierGroups((items) => [...items, { name: "", required: false, optionsText: "" }])} addLabel={isArabic ? "إضافة مجموعة" : "Add group"}>
              {modifierGroups.map((item, index) => <div key={`modifier-${index}`} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3"><div className="flex gap-2"><input placeholder={isArabic ? "اسم المجموعة، مثال: نوع الحليب" : "Group name, e.g. Milk type"} value={item.name} onChange={(event) => setModifierGroups((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--cream)]" /><RemoveButton label={isArabic ? "حذف المجموعة" : "Remove group"} onClick={() => setModifierGroups((items) => items.filter((_, rowIndex) => rowIndex !== index))} /></div><input placeholder={isArabic ? "الخيارات مفصولة بفاصلة: كامل الدسم، شوفان، لوز" : "Comma-separated options: Whole, Oat, Almond"} value={item.optionsText} onChange={(event) => setModifierGroups((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, optionsText: event.target.value } : row))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--cream)]" /><label className="flex items-center gap-2 text-xs text-[var(--muted)]"><input type="checkbox" checked={item.required} onChange={(event) => setModifierGroups((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, required: event.target.checked } : row))} />{isArabic ? "اختيار مطلوب" : "Selection required"}</label></div>)}
            </ConfigurationSection>
            <button type="button" onClick={saveConfiguration} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black">{isArabic ? "حفظ تخصيص الصنف" : "Save product configuration"}</button>
          </div>
        </DashboardCard>
        <RuntimeStatusCard title={isArabic ? "حوكمة دليل الأصناف" : "Catalog Governance"} statuses={[
          { label: isArabic ? "عزل SALORA" : "SALORA isolation", status: "ok", detail: isArabic ? "جميع الاستعلامات والتعديلات محصورة بعلامة SALORA" : "All catalog queries and mutations are constrained to brandKey SALORA" },
          { label: isArabic ? "المحتوى ثنائي اللغة" : "Bilingual content", status: products.every((product) => product.nameAr && product.nameEn) ? "ok" : "warning", detail: `${products.filter((product) => product.nameAr && product.nameEn).length}/${products.length} ${isArabic ? "صنفًا مكتملًا" : "products complete"}` },
          { label: isArabic ? "اعتماد الأسعار" : "Pricing approval", status: products.some((product) => product.status === "DRAFT") ? "warning" : "ok", detail: `${products.filter((product) => product.status === "DRAFT").length} ${isArabic ? "مسودة تنتظر الاعتماد" : "draft products awaiting approval"}` },
          { label: isArabic ? "جاهزية الصور" : "Media readiness", status: missingImages ? "warning" : "ok", detail: `${missingImages} ${isArabic ? "صنفًا ينتظر صورة معتمدة" : "products await approved images"}` }
        ]} />
      </DashboardGrid>

      <DashboardGrid columns="two">
        <RuntimeStatusCard title={isArabic ? "مركز تحكم الذكاء الاصطناعي" : "AI Control Center"} statuses={[
          { label: isArabic ? "خدمات الذكاء الاصطناعي" : "AI services", status: aiFlags.length ? "ok" : "warning", detail: `${enabledAiFlags}/${aiFlags.length} ${isArabic ? "إمكانات مفعّلة" : "governed capabilities enabled"}` },
          { label: isArabic ? "المراجعة البشرية" : "Human review", status: "ok", detail: isArabic ? "يبقى المحتوى المولد مسودة حتى يعتمده المشغّل" : "Generated product content remains draft-only until an operator approves it" },
          { label: isArabic ? "سجل التدقيق" : "Audit trail", status: auditLogs.length ? "ok" : "warning", detail: `${auditLogs.length} ${isArabic ? "حدث حوكمة حديث" : "recent governance events visible"}` },
          { label: isArabic ? "الأسرار" : "Secrets", status: "ok", detail: isArabic ? "تبقى بيانات المزودين على الخادم ولا تظهر في منصة التحكم" : "Provider credentials stay server-side and are never exposed in Control Tower" }
        ]} />
        <DashboardCard title={isArabic ? "مفاتيح قدرات الذكاء الاصطناعي" : "AI Capability Switchboard"} eyebrow={isArabic ? "أتمتة محكومة" : "Governed automation"}>
          <div className="grid gap-2">
            {aiFlags.length ? aiFlags.map((flag) => (
              <button key={flag.id} type="button" onClick={() => toggleFlag(flag)} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-left text-sm text-[var(--cream)]">
                <span><strong className="block">{flag.key}</strong><small className="text-[var(--muted)]">{flag.environment}</small></span>
                <span className={flag.enabled ? "text-emerald-200" : "text-red-200"}>{flag.enabled ? (isArabic ? "مُفعّل" : "Enabled") : (isArabic ? "متوقف" : "Paused")}</span>
              </button>
            )) : <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Create AI feature flags in Control Tower to govern concierge, recommendations, pairings, loyalty, and product copy independently.</p>}
          </div>
        </DashboardCard>
      </DashboardGrid>

      <DashboardGrid columns="two">
        <DashboardCard title={isArabic ? "مفاتيح الميزات" : "Feature Flags"} eyebrow={isArabic ? "بيئة التشغيل" : "Staging"}>
          <div className="grid gap-2">
            {flags.map((flag) => (
              <button key={flag.id} type="button" onClick={() => toggleFlag(flag)} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-[var(--cream)]">
                <span>{flag.key}</span>
                <span className={flag.enabled ? "text-emerald-200" : "text-red-200"}>{String(flag.enabled)}</span>
              </button>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title={isArabic ? "استوديو الأصناف بالذكاء الاصطناعي" : "AI Product Studio"} eyebrow={isArabic ? "توليد ← مراجعة ← نشر" : "Generate → review → publish"}>
          <div className="grid gap-3">
            <select value={aiOperation} onChange={(event) => setAiOperation(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
              {["description", "short_copy", "pairing", "category", "upsell", "image_prompt"].map((operation) => <option key={operation} value={operation}>{operation}</option>)}
            </select>
            <p className="text-xs leading-5 text-[var(--muted)]">{isArabic ? "يستخدم الصنف المحدد كسياق موثوق، ولا ينشر أي ناتج تلقائيًا." : "Uses the selected catalog product as grounded context. Output is never published automatically."}</p>
            <button type="button" disabled={!selectedProduct || state.status === "submitting"} onClick={generateDraft} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{isArabic ? "توليد مسودة محكومة" : "Generate governed draft"}</button>
            {aiDraft ? <p className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-[var(--muted)]">{aiDraft}</p> : null}
          </div>
        </DashboardCard>
      </DashboardGrid>

      <DashboardGrid columns="two">
        <DashboardCard title={isArabic ? "القسائم والعروض" : "Coupons & Promotions"} eyebrow={isArabic ? "عروض الإطلاق" : "Launch offers"}>
          <div className="grid gap-2 text-sm text-[var(--muted)]">
            {coupons.map((coupon) => <p key={coupon.id}>{coupon.code}: {coupon.name} ({coupon.isActive ? "active" : "inactive"}) usage {coupon.usageCount ?? 0}</p>)}
            {promotions.map((promotion) => <p key={promotion.id}>{promotion.slug}: {promotion.name} ({promotion.status})</p>)}
          </div>
        </DashboardCard>
        <DashboardCard title={isArabic ? "سجلات الحوكمة" : "Governance Logs"} eyebrow={isArabic ? "أحدث 100 سجل" : "Latest 100"}>
          <div className="grid gap-3 text-xs text-[var(--muted)]">
            <p>{isArabic ? "سجلات النشاط" : "Activity logs"}: {activityLogs.length}</p>
            <p>{isArabic ? "سجلات التدقيق" : "Audit logs"}: {auditLogs.length}</p>
            {activityLogs.slice(0, 3).map((log) => <p key={log.id} className="font-mono">{log.action} {log.entityType} {log.requestId}</p>)}
          </div>
        </DashboardCard>
      </DashboardGrid>
    </div>
  );
}
