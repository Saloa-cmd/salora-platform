"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { controlTowerPatch, controlTowerPost } from "@/lib/control-tower/client";
import type { MutationState } from "@/lib/control-tower/types";
import { useControlTowerLocale } from "./ControlTowerLocale";

const initialState: MutationState = { status: "idle" };

function ResultNotice({ state }: { state: MutationState }) {
  const { isArabic } = useControlTowerLocale();
  if (state.status === "idle" || state.status === "submitting") return null;
  const tone = state.status === "success" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-red-300/25 bg-red-300/10 text-red-100";
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${tone}`}>
      {state.message}
      {state.requestId ? <span className="mt-1 block break-words font-mono text-xs opacity-80">{isArabic ? "رقم الطلب" : "Request ID"}: {state.requestId}</span> : null}
    </p>
  );
}

export function ProductActionPanel() {
  const { isArabic } = useControlTowerLocale();
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ slug: "", nameAr: "", nameEn: "", category: "", descriptionAr: "", descriptionEn: "", basePrice: "", tags: "" });

  async function submit() {
    setState({ status: "submitting", message: isArabic ? "جارٍ إنشاء الصنف..." : "Creating product..." });
    setState(await controlTowerPost("/api/control-tower/simple-launch/products", {
      action: "create",
      slug: form.slug,
      name: form.nameEn,
      nameAr: form.nameAr,
      nameEn: form.nameEn,
      categoryName: form.category,
      description: form.descriptionEn,
      descriptionAr: form.descriptionAr,
      descriptionEn: form.descriptionEn,
      basePrice: Number(form.basePrice),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      status: "DRAFT"
    }));
  }

  return (
    <DashboardCard title={isArabic ? "إنشاء صنف جديد" : "Create new product"} eyebrow={isArabic ? "مسودة أولًا" : "Draft-first workflow"}>
      <p className="mb-4 text-sm leading-6 text-[var(--muted)]">{isArabic ? "يُنشأ المنتج كمسودة دائمًا، ثم يمر عبر السعر والصورة والفئة والخيارات قبل التفعيل." : "Products are always created as drafts, then pass price, media, category and options gates before activation."}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["slug", "nameAr", "nameEn", "category", "basePrice"] as const).map((field) => (
          <label key={field} className="grid gap-2 text-sm text-[var(--muted)]">
            {{ slug: isArabic ? "المعرّف الإنجليزي" : "Slug", nameAr: isArabic ? "الاسم العربي" : "Arabic name", nameEn: isArabic ? "الاسم الإنجليزي" : "English name", category: isArabic ? "الفئة" : "Category", basePrice: isArabic ? "السعر (ر.ع) — اختياري للمسودة" : "Price (OMR) — optional for draft" }[field]}
            <input value={form[field]} inputMode={field === "basePrice" ? "decimal" : undefined} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="min-h-11 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
          </label>
        ))}
        <label className="grid gap-2 text-sm text-[var(--muted)]">{isArabic ? "الوصف العربي" : "Arabic description"}<textarea value={form.descriptionAr} onChange={(event) => setForm({ ...form, descriptionAr: event.target.value })} className="min-h-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" /></label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">{isArabic ? "الوصف الإنجليزي" : "English description"}<textarea value={form.descriptionEn} onChange={(event) => setForm({ ...form, descriptionEn: event.target.value })} className="min-h-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" /></label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "الوسوم" : "Tags"}
          <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="matcha, iced, signature" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting" || !form.slug || !form.nameAr || !form.nameEn || !form.category} className="min-h-11 rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{isArabic ? "حفظ كمسودة" : "Save as draft"}</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}

export function InventoryActionPanel() {
  const { isArabic } = useControlTowerLocale();
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ ingredientName: "", unit: "units", quantity: "0", reorderThreshold: "0", reason: "" });

  async function submit() {
    setState({ status: "submitting", message: isArabic ? "جارٍ تسجيل الحركة..." : "Recording movement..." });
    setState(await controlTowerPost("/api/inventory", {
      ...form,
      quantity: Number(form.quantity),
      reorderThreshold: Number(form.reorderThreshold),
      reason: form.reason || undefined
    }));
  }

  return (
    <DashboardCard title={isArabic ? "تسجيل حركة مخزون" : "Record Inventory Movement"} eyebrow={isArabic ? "عملية مباشرة دون برمجة" : "Live no-code action"}>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["ingredientName", "unit", "quantity", "reorderThreshold", "reason"] as const).map((field) => (
          <label key={field} className="grid gap-2 text-sm text-[var(--muted)]">
            {{ ingredientName: isArabic ? "اسم المكوّن" : "Ingredient name", unit: isArabic ? "الوحدة" : "Unit", quantity: isArabic ? "الكمية" : "Quantity", reorderThreshold: isArabic ? "حد إعادة الطلب" : "Reorder threshold", reason: isArabic ? "السبب" : "Reason" }[field]}
            <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{isArabic ? "تسجيل الحركة" : "Record movement"}</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}

export function LoyaltyActionPanel() {
  const { isArabic } = useControlTowerLocale();
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ customerId: "", points: "10", reason: "" });

  async function submit() {
    setState({ status: "submitting", message: isArabic ? "جارٍ منح النقاط..." : "Awarding points..." });
    setState(await controlTowerPost("/api/loyalty", { ...form, points: Number(form.points) }));
  }

  return (
    <DashboardCard title={isArabic ? "منح نقاط الولاء" : "Award Loyalty Points"} eyebrow={isArabic ? "عملية مباشرة دون برمجة" : "Live no-code action"}>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["customerId", "points", "reason"] as const).map((field) => (
          <label key={field} className="grid gap-2 text-sm text-[var(--muted)]">
            {{ customerId: isArabic ? "رقم العميل" : "Customer ID", points: isArabic ? "النقاط" : "Points", reason: isArabic ? "السبب" : "Reason" }[field]}
            <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{isArabic ? "منح النقاط" : "Award points"}</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}

export function NotificationActionPanel() {
  const { isArabic } = useControlTowerLocale();
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ recipient: "", channel: "IN_APP", templateKey: "", title: "", message: "" });

  async function submit() {
    setState({ status: "submitting", message: isArabic ? "جارٍ تجهيز الإشعار..." : "Queueing notification..." });
    setState(await controlTowerPost("/api/notifications", {
      recipient: form.recipient,
      channel: form.channel,
      templateKey: form.templateKey || undefined,
      payload: { title: form.title, message: form.message }
    }));
  }

  return (
    <DashboardCard title={isArabic ? "إرسال إشعار" : "Queue Notification"} eyebrow={isArabic ? "عملية مباشرة دون برمجة" : "Live no-code action"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "المستلم" : "Recipient"}
          <input value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "القناة" : "Channel"}
          <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
            <option>EMAIL</option>
            <option>SMS</option>
            <option>PUSH</option>
            <option>IN_APP</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "مفتاح القالب (اختياري)" : "Template key (optional)"}
          <input value={form.templateKey} onChange={(event) => setForm({ ...form, templateKey: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "عنوان الإشعار" : "Notification title"}
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)] sm:col-span-2">{isArabic ? "نص الرسالة" : "Message"}<textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="min-h-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" /></label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{isArabic ? "إرسال الإشعار" : "Queue notification"}</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}

export function RuntimeConfigActionPanel() {
  const { isArabic } = useControlTowerLocale();
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ scope: "FEATURE_FLAGS", key: "", valueType: "boolean", value: "true", isActive: "true" });

  async function submit() {
    setState({ status: "submitting", message: isArabic ? "جارٍ حفظ الإعداد..." : "Saving runtime configuration..." });
    const parsedValue = form.valueType === "boolean" ? form.value === "true" : form.valueType === "number" ? Number(form.value) : form.value;
    const value: Record<string, unknown> = form.valueType === "boolean" ? { enabled: parsedValue } : { value: parsedValue };
    setState(await controlTowerPatch("/api/control-tower/simple-launch/runtime-config", {
      scope: form.scope,
      key: form.key,
      value,
      isActive: form.isActive === "true"
    }));
  }

  return (
    <DashboardCard title={isArabic ? "إعدادات التشغيل" : "Runtime Configuration"} eyebrow={isArabic ? "محفوظة في قاعدة البيانات" : "Database-backed configuration"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "المجال" : "Scope"}
          <select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
            {["PRICING", "PROMOTIONS", "PAYMENTS", "LOYALTY", "AI_ROUTING", "AI_PROVIDER", "WHATSAPP", "INSTAGRAM", "PROVIDERS", "NOTIFICATIONS", "FEATURE_FLAGS", "HOMEPAGE", "APP", "RECOMMENDATIONS", "OBSERVABILITY"].map((scope) => <option key={scope}>{scope}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "مفتاح الإعداد" : "Configuration key"}
          <input value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "نوع القيمة" : "Value type"}
          <select value={form.valueType} onChange={(event) => setForm({ ...form, valueType: event.target.value, value: event.target.value === "boolean" ? "true" : "" })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]"><option value="boolean">{isArabic ? "تشغيل / إيقاف" : "On / Off"}</option><option value="text">{isArabic ? "نص" : "Text"}</option><option value="number">{isArabic ? "رقم" : "Number"}</option></select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">{isArabic ? "القيمة" : "Value"}{form.valueType === "boolean" ? <select value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]"><option value="true">{isArabic ? "مُشغّل" : "On"}</option><option value="false">{isArabic ? "متوقف" : "Off"}</option></select> : <input type={form.valueType === "number" ? "number" : "text"} value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />}</label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          {isArabic ? "حالة الإعداد" : "Configuration status"}
          <select value={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
            <option value="true">{isArabic ? "نشط" : "Active"}</option>
            <option value="false">{isArabic ? "غير نشط" : "Inactive"}</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{isArabic ? "حفظ الإعداد" : "Save configuration"}</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}
