"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { RuntimeStatusCard } from "@/components/dashboard/RuntimeStatusCard";
import { controlTowerGet, controlTowerPatch, controlTowerPost } from "@/lib/control-tower/client";
import type { MutationState } from "@/lib/control-tower/types";

type CategoryRow = { id: string; slug: string; name: string; sortOrder: number; _count?: { products: number } };
type ProductRow = { id: string; slug: string; name: string; status: string; basePrice: string | number; category?: { name: string }; images?: Array<{ id: string; publicUrl?: string; isPrimary: boolean }> };
type CouponRow = { id: string; code: string; name: string; isActive: boolean; usageCount?: number };
type PromotionRow = { id: string; slug: string; name: string; status: string };
type FeatureFlagRow = { id: string; key: string; environment: string; enabled: boolean };
type LogRow = { id: string; action?: string; entityType: string; requestId?: string; createdAt: string };

const initialState: MutationState = { status: "idle" };

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

  async function refresh() {
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
      setSelectedSlug((current) => current || productResult.data?.[0]?.slug || "");
    }
    if (categoryResult.data) setCategories(categoryResult.data);
    if (couponResult.data) setCoupons(couponResult.data);
    if (promotionResult.data) setPromotions(promotionResult.data);
    if (flagResult.data) setFlags(flagResult.data);
    if (activityResult.data) setActivityLogs(activityResult.data);
    if (auditResult.data) setAuditLogs(auditResult.data);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, []);

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
        <RuntimeStatusCard title="Simple Launch Data" statuses={[
          { label: "Products", status: products.length >= 94 ? "ok" : "warning", detail: `${products.length} products visible to Control Tower` },
          { label: "Categories", status: categories.length ? "ok" : "warning", detail: `${categories.length} categories` },
          { label: "Image gaps", status: missingImages ? "warning" : "ok", detail: `${missingImages} products without images` },
          { label: "Offers", status: promotions.length || coupons.length ? "ok" : "warning", detail: `${promotions.length} promotions, ${coupons.length} coupons` }
        ]} />
        <DashboardCard title="Product Operator" eyebrow="DB-backed">
          <div className="grid gap-3">
            <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
              {products.map((product) => <option key={product.id} value={product.slug}>{product.name}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="OMR price" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
              <button type="button" onClick={updatePrice} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black">Update price</button>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
                {["ACTIVE", "PAUSED", "ARCHIVED", "DRAFT"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <button type="button" onClick={updateStatus} className="rounded-lg border border-[var(--border-gold)] px-4 py-2 text-sm font-semibold text-[var(--gold-soft)]">Set status</button>
              <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Real image URL" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)] sm:col-span-2" />
              <button type="button" onClick={addImage} className="rounded-lg border border-[var(--border-gold)] px-4 py-2 text-sm font-semibold text-[var(--gold-soft)]">Add image</button>
            </div>
            <ResultNotice state={state} />
          </div>
        </DashboardCard>
      </DashboardGrid>

      <DashboardGrid columns="two">
        <RuntimeStatusCard title="AI Control Center" statuses={[
          { label: "AI services", status: aiFlags.length ? "ok" : "warning", detail: `${enabledAiFlags}/${aiFlags.length} governed capabilities enabled` },
          { label: "Human review", status: "ok", detail: "Generated product content remains draft-only until an operator approves it" },
          { label: "Audit trail", status: auditLogs.length ? "ok" : "warning", detail: `${auditLogs.length} recent governance events visible` },
          { label: "Secrets", status: "ok", detail: "Provider credentials stay server-side and are never exposed in Control Tower" }
        ]} />
        <DashboardCard title="AI Capability Switchboard" eyebrow="Governed automation">
          <div className="grid gap-2">
            {aiFlags.length ? aiFlags.map((flag) => (
              <button key={flag.id} type="button" onClick={() => toggleFlag(flag)} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-left text-sm text-[var(--cream)]">
                <span><strong className="block">{flag.key}</strong><small className="text-[var(--muted)]">{flag.environment}</small></span>
                <span className={flag.enabled ? "text-emerald-200" : "text-red-200"}>{flag.enabled ? "Enabled" : "Paused"}</span>
              </button>
            )) : <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Create AI feature flags in Control Tower to govern concierge, recommendations, pairings, loyalty, and product copy independently.</p>}
          </div>
        </DashboardCard>
      </DashboardGrid>

      <DashboardGrid columns="two">
        <DashboardCard title="Feature Flags" eyebrow="Staging">
          <div className="grid gap-2">
            {flags.map((flag) => (
              <button key={flag.id} type="button" onClick={() => toggleFlag(flag)} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-[var(--cream)]">
                <span>{flag.key}</span>
                <span className={flag.enabled ? "text-emerald-200" : "text-red-200"}>{String(flag.enabled)}</span>
              </button>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title="AI Product Studio" eyebrow="Generate → review → publish">
          <div className="grid gap-3">
            <select value={aiOperation} onChange={(event) => setAiOperation(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
              {["description", "short_copy", "pairing", "category", "upsell", "image_prompt"].map((operation) => <option key={operation} value={operation}>{operation}</option>)}
            </select>
            <p className="text-xs leading-5 text-[var(--muted)]">Uses the selected catalog product as grounded context. Output is never published automatically.</p>
            <button type="button" disabled={!selectedProduct || state.status === "submitting"} onClick={generateDraft} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Generate governed draft</button>
            {aiDraft ? <p className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-[var(--muted)]">{aiDraft}</p> : null}
          </div>
        </DashboardCard>
      </DashboardGrid>

      <DashboardGrid columns="two">
        <DashboardCard title="Coupons & Promotions" eyebrow="Launch offers">
          <div className="grid gap-2 text-sm text-[var(--muted)]">
            {coupons.map((coupon) => <p key={coupon.id}>{coupon.code}: {coupon.name} ({coupon.isActive ? "active" : "inactive"}) usage {coupon.usageCount ?? 0}</p>)}
            {promotions.map((promotion) => <p key={promotion.id}>{promotion.slug}: {promotion.name} ({promotion.status})</p>)}
          </div>
        </DashboardCard>
        <DashboardCard title="Governance Logs" eyebrow="Latest 100">
          <div className="grid gap-3 text-xs text-[var(--muted)]">
            <p>Activity logs: {activityLogs.length}</p>
            <p>Audit logs: {auditLogs.length}</p>
            {activityLogs.slice(0, 3).map((log) => <p key={log.id} className="font-mono">{log.action} {log.entityType} {log.requestId}</p>)}
          </div>
        </DashboardCard>
      </DashboardGrid>
    </div>
  );
}
