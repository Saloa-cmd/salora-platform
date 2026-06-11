"use client";

import { useEffect, useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { controlTowerGet, controlTowerPatch, controlTowerPost } from "@/lib/control-tower/client";

type ProviderRow = { name: string; health: string; readiness: string; risk: string; certificationScore: number; lastValidation: string };
type OrderRow = { id: string; status: string; customerName?: string | null; customerPhone?: string | null; total: string | number; metadata?: Record<string, unknown> | null };
type MediaResponse = { images: unknown[]; drafts: Array<{ id: string; status: string; source: string; product?: { slug: string; name: string } }> };
type ChannelStatus = { status: string; targetContact?: string; targetAccount?: string };

export function SupremacyCommandCenter() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [media, setMedia] = useState<MediaResponse>({ images: [], drafts: [] });
  const [whatsapp, setWhatsapp] = useState<ChannelStatus | null>(null);
  const [instagram, setInstagram] = useState<ChannelStatus | null>(null);
  const [productSlug, setProductSlug] = useState("american-cheese-cake");
  const [message, setMessage] = useState("Supremacy controls are ready.");

  async function refresh() {
    const [providerResult, orderResult, mediaResult, whatsappResult, instagramResult] = await Promise.all([
      controlTowerGet<ProviderRow[]>("/api/control-tower/runtime-governance"),
      controlTowerGet<OrderRow[]>("/api/control-tower/orders"),
      controlTowerGet<MediaResponse>("/api/control-tower/media"),
      controlTowerGet<ChannelStatus>("/api/control-tower/whatsapp"),
      controlTowerGet<ChannelStatus>("/api/control-tower/instagram")
    ]);
    if (providerResult.status === "success" && providerResult.data) setProviders(providerResult.data);
    if (orderResult.status === "success" && orderResult.data) setOrders(orderResult.data);
    if (mediaResult.status === "success" && mediaResult.data) setMedia(mediaResult.data);
    if (whatsappResult.status === "success" && whatsappResult.data) setWhatsapp(whatsappResult.data);
    if (instagramResult.status === "success" && instagramResult.data) setInstagram(instagramResult.data);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function generateImagePrompt() {
    const result = await controlTowerPost("/api/control-tower/media", { action: "generate-image-prompt", productSlug });
    setMessage(result.status === "success" ? "Image prompt draft created for human review." : result.message ?? "Request failed.");
    if (result.status === "success") void refresh();
  }

  async function moveOrder(orderId: string, status: string) {
    const result = await controlTowerPatch("/api/control-tower/orders", { orderId, status });
    setMessage(result.status === "success" ? `Order moved to ${status}.` : result.message ?? "Order update failed.");
    if (result.status === "success") void refresh();
  }

  return (
    <DashboardGrid columns="two">
      <DashboardCard title="Runtime Governance" eyebrow="Supremacy">
        <div className="space-y-3">
          {providers.map((provider) => (
            <div key={provider.name} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[var(--cream)]">{provider.name}</p>
                <span className="text-xs font-semibold text-[var(--gold-soft)]">{provider.readiness}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">Health: {provider.health} / Risk: {provider.risk} / Score: {provider.certificationScore.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Product Media Command" eyebrow="Draft approval">
        <p className="text-sm text-[var(--muted)]">Published images: {media.images.length} / Drafts: {media.drafts.length}</p>
        <div className="mt-4 flex gap-2">
          <input value={productSlug} onChange={(event) => setProductSlug(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--cream)]" />
          <button onClick={() => void generateImagePrompt()} className="rounded-lg bg-[var(--gold)] px-3 py-2 text-sm font-semibold text-black">AI prompt</button>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">Image prompts and drafts never publish without approval.</p>
      </DashboardCard>

      <DashboardCard title="COD Order Queue" eyebrow="Commerce">
        {orders.length === 0 ? <p className="text-sm text-[var(--muted)]">No DB-backed COD orders in the current queue.</p> : null}
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-semibold text-[var(--cream)]">{order.customerName ?? order.customerPhone ?? "Guest order"}</p>
              <p className="text-xs text-[var(--muted)]">Status: {order.status} / Total: OMR {Number(order.total).toFixed(3)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["PREPARING", "READY", "DELIVERED", "CANCELLED"].map((status) => (
                  <button key={status} onClick={() => void moveOrder(order.id, status)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--cream)]">{status}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Meta Command Centers" eyebrow="WhatsApp + Instagram">
        <div className="space-y-3 text-sm">
          <p className="text-[var(--cream)]">WhatsApp: {whatsapp?.status ?? "BLOCKED"} <span className="text-[var(--muted)]">{whatsapp?.targetContact}</span></p>
          <p className="text-[var(--cream)]">Instagram: {instagram?.status ?? "BLOCKED"} <span className="text-[var(--muted)]">{instagram?.targetAccount}</span></p>
          <p className="text-xs text-[var(--muted)]">Draft workflows are available; sending/publishing remains blocked until Meta credentials and approval pass.</p>
        </div>
        <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-[var(--muted)]">{message}</p>
      </DashboardCard>
    </DashboardGrid>
  );
}
