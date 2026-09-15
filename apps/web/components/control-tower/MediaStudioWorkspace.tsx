"use client";

import { useMemo, useState } from "react";

const formats = [
  { id: "reel", label: "Reel 9:16", ratio: "1080×1920" },
  { id: "story", label: "Story 9:16", ratio: "1080×1920" },
  { id: "feed", label: "Feed 4:5", ratio: "1080×1350" },
  { id: "landscape", label: "16:9", ratio: "1920×1080" },
] as const;

const goals = [
  { id: "product", label: "Product spotlight" },
  { id: "offer", label: "Offer / promotion" },
  { id: "launch", label: "New launch" },
  { id: "brand", label: "Brand cinematic" },
] as const;

export function MediaStudioWorkspace() {
  const [format, setFormat] = useState<(typeof formats)[number]["id"]>("reel");
  const [goal, setGoal] = useState<(typeof goals)[number]["id"]>("product");
  const [prompt, setPrompt] = useState("Create a premium cinematic SALORA product video using the current brand identity and approved product media.");

  const selectedFormat = useMemo(() => formats.find((item) => item.id === format) ?? formats[0], [format]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <section className="space-y-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold-soft)]">SALORA AI Media Studio</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cream)]">Create a campaign draft</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Foundation preview for a governed media workflow: choose goal and format, describe the creative direction, then move through storyboard, review and final approval. No publishing or production render is enabled in this phase.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-[var(--cream)]">
            <span className="font-medium">Campaign goal</span>
            <select value={goal} onChange={(event) => setGoal(event.target.value as typeof goal)} className="min-h-11 rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 text-sm text-[var(--cream)] outline-none focus:border-[var(--border-gold)]">
              {goals.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-[var(--cream)]">
            <span className="font-medium">Output format</span>
            <select value={format} onChange={(event) => setFormat(event.target.value as typeof format)} className="min-h-11 rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 text-sm text-[var(--cream)] outline-none focus:border-[var(--border-gold)]">
              {formats.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm text-[var(--cream)]">
          <span className="font-medium">Creative direction</span>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} className="rounded-2xl border border-[var(--border-subtle)] bg-black/20 px-4 py-3 text-sm leading-6 text-[var(--cream)] outline-none focus:border-[var(--border-gold)]" />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          {["Brand profile", "Approved media", "Human approval"].map((label) => (
            <div key={label} className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
              <p className="text-sm font-semibold text-[var(--cream)]">{label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Governed source of truth for every generated draft.</p>
            </div>
          ))}
        </div>

        <button type="button" disabled className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--gold)] px-5 text-sm font-semibold text-[#17120a] opacity-55" title="Enabled in a later phase after render infrastructure and audit controls are connected.">Generate draft — coming next</button>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-[var(--border-gold)] bg-[var(--surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold-soft)]">Preview contract</p>
          <div className="mt-4 aspect-[9/16] max-h-[520px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_30%_20%,rgba(201,164,92,0.16),transparent_34%),linear-gradient(180deg,#16120d,#080808)] p-5">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]"><span>{selectedFormat.label}</span><span>{selectedFormat.ratio}</span></div>
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold-soft)]">TASTE THE HARMONY</p>
                <h3 className="mt-2 text-3xl font-semibold text-[var(--cream)]">SALORA</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--muted)]">Storyboard-first media generation with reusable scenes, product assets and a separate review gate.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
          <p className="text-sm font-semibold text-[var(--cream)]">Phase 1 boundaries</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
            <li>• No Production changes or publishing.</li>
            <li>• No direct database writes from the client.</li>
            <li>• No secret keys exposed to the browser.</li>
            <li>• Render engine and AI generation remain disconnected until reviewed.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
