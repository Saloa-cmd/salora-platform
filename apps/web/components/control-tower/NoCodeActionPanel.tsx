"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { controlTowerPatch, controlTowerPost } from "@/lib/control-tower/client";
import type { MutationState } from "@/lib/control-tower/types";

const initialState: MutationState = { status: "idle" };

function ResultNotice({ state }: { state: MutationState }) {
  if (state.status === "idle" || state.status === "submitting") return null;
  const tone = state.status === "success" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-red-300/25 bg-red-300/10 text-red-100";
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${tone}`}>
      {state.message}
      {state.requestId ? <span className="mt-1 block break-words font-mono text-xs opacity-80">Request ID: {state.requestId}</span> : null}
    </p>
  );
}

export function ProductActionPanel() {
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ slug: "", name: "", category: "", description: "", basePrice: "2.500", tags: "", pairingHint: "" });

  async function submit() {
    setState({ status: "submitting", message: "Creating product..." });
    setState(await controlTowerPost("/api/control-tower/simple-launch/products", {
      action: "create",
      slug: form.slug,
      name: form.name,
      categoryName: form.category,
      description: form.description,
      basePrice: Number(form.basePrice),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      pairingHint: form.pairingHint || undefined,
      status: "ACTIVE"
    }));
  }

  return (
    <DashboardCard title="Create Product" eyebrow="Live no-code action">
      <div className="grid gap-3 sm:grid-cols-2">
        {(["slug", "name", "category", "basePrice"] as const).map((field) => (
          <label key={field} className="grid gap-2 text-sm text-[var(--muted)]">
            {field}
            <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
          </label>
        ))}
        <label className="grid gap-2 text-sm text-[var(--muted)] sm:col-span-2">
          description
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          tags
          <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="matcha, iced, signature" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          pairing hint
          <input value={form.pairingHint} onChange={(event) => setForm({ ...form, pairingHint: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Create product</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}

export function InventoryActionPanel() {
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ ingredientName: "", unit: "units", quantity: "0", reorderThreshold: "0", reason: "" });

  async function submit() {
    setState({ status: "submitting", message: "Recording movement..." });
    setState(await controlTowerPost("/api/inventory", {
      ...form,
      quantity: Number(form.quantity),
      reorderThreshold: Number(form.reorderThreshold),
      reason: form.reason || undefined
    }));
  }

  return (
    <DashboardCard title="Record Inventory Movement" eyebrow="Live no-code action">
      <div className="grid gap-3 sm:grid-cols-2">
        {(["ingredientName", "unit", "quantity", "reorderThreshold", "reason"] as const).map((field) => (
          <label key={field} className="grid gap-2 text-sm text-[var(--muted)]">
            {field}
            <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Record movement</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}

export function LoyaltyActionPanel() {
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ customerId: "", points: "10", reason: "" });

  async function submit() {
    setState({ status: "submitting", message: "Awarding points..." });
    setState(await controlTowerPost("/api/loyalty", { ...form, points: Number(form.points) }));
  }

  return (
    <DashboardCard title="Award Loyalty Points" eyebrow="Live no-code action">
      <div className="grid gap-3 sm:grid-cols-3">
        {(["customerId", "points", "reason"] as const).map((field) => (
          <label key={field} className="grid gap-2 text-sm text-[var(--muted)]">
            {field}
            <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Award points</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}

export function NotificationActionPanel() {
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ recipient: "", channel: "IN_APP", templateKey: "", payload: "{}" });

  async function submit() {
    setState({ status: "submitting", message: "Queueing notification..." });
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(form.payload) as Record<string, unknown>;
    } catch {
      setState({ status: "error", message: "Payload must be valid JSON." });
      return;
    }
    setState(await controlTowerPost("/api/notifications", {
      recipient: form.recipient,
      channel: form.channel,
      templateKey: form.templateKey || undefined,
      payload
    }));
  }

  return (
    <DashboardCard title="Queue Notification" eyebrow="Live no-code action">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          recipient
          <input value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          channel
          <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
            <option>EMAIL</option>
            <option>SMS</option>
            <option>PUSH</option>
            <option>IN_APP</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          template key
          <input value={form.templateKey} onChange={(event) => setForm({ ...form, templateKey: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          payload JSON
          <input value={form.payload} onChange={(event) => setForm({ ...form, payload: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[var(--cream)]" />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Queue notification</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}

export function RuntimeConfigActionPanel() {
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState({ scope: "FEATURE_FLAGS", key: "", value: "{\"enabled\":true}", isActive: "true" });

  async function submit() {
    setState({ status: "submitting", message: "Saving runtime configuration..." });
    let value: Record<string, unknown> = {};
    try {
      value = JSON.parse(form.value) as Record<string, unknown>;
    } catch {
      setState({ status: "error", message: "Value must be valid JSON." });
      return;
    }
    setState(await controlTowerPatch("/api/control-tower/simple-launch/runtime-config", {
      scope: form.scope,
      key: form.key,
      value,
      isActive: form.isActive === "true"
    }));
  }

  return (
    <DashboardCard title="Runtime Configuration" eyebrow="Database-backed when staging DB is active">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          scope
          <select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
            {["PRICING", "PROMOTIONS", "PAYMENTS", "LOYALTY", "AI_ROUTING", "AI_PROVIDER", "WHATSAPP", "INSTAGRAM", "PROVIDERS", "NOTIFICATIONS", "FEATURE_FLAGS", "HOMEPAGE", "APP", "RECOMMENDATIONS", "OBSERVABILITY"].map((scope) => <option key={scope}>{scope}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          key
          <input value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)] sm:col-span-2">
          value JSON
          <textarea value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className="min-h-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[var(--cream)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          active
          <select value={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[var(--cream)]">
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={submit} disabled={state.status === "submitting"} className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Save configuration</button>
        <ResultNotice state={state} />
      </div>
    </DashboardCard>
  );
}
