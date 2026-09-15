"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { controlTowerGet, controlTowerPost } from "@/lib/control-tower/client";
import type { RenderJob } from "@/lib/media-studio/contracts";

type ProductImage = { id: string; publicUrl?: string | null; altText?: string | null; isPrimary?: boolean };
type Product = { id: string; slug: string; name: string; nameAr?: string | null; nameEn?: string | null; status: string; basePrice: string | number; images?: ProductImage[]; category?: { name: string } | null };
type Scene = { id: string; title: string; durationSeconds: number; direction: string; assetIds: string[] };

const formats = [
  { id: "reel", label: "Reel 9:16", ratio: "1080×1920" }, { id: "story", label: "Story 9:16", ratio: "1080×1920" },
  { id: "feed", label: "Feed 4:5", ratio: "1080×1350" }, { id: "landscape", label: "16:9", ratio: "1920×1080" }
] as const;
const goals = [{ id: "product", label: "Product spotlight" }, { id: "offer", label: "Offer / promotion" }, { id: "launch", label: "New launch" }, { id: "brand", label: "Brand cinematic" }] as const;
const initialScenes: Scene[] = [
  { id: "hook", title: "Hook", durationSeconds: 3, direction: "Open on the approved hero product image with restrained cinematic movement.", assetIds: [] },
  { id: "detail", title: "Product detail", durationSeconds: 7, direction: "Reveal product name, texture and a concise bilingual-ready product moment.", assetIds: [] },
  { id: "brand", title: "Brand close", durationSeconds: 5, direction: "Close on SALORA and Taste the Harmony with quiet premium pacing.", assetIds: [] }
];

export function MediaStudioWorkspace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSlug, setProductSlug] = useState("");
  const [format, setFormat] = useState<(typeof formats)[number]["id"]>("reel");
  const [goal, setGoal] = useState<(typeof goals)[number]["id"]>("product");
  const [prompt, setPrompt] = useState("Create a premium cinematic SALORA product video using the current brand identity and approved product media.");
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [job, setJob] = useState<RenderJob | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([controlTowerGet<Product[]>("/api/control-tower/simple-launch/products?limit=100&offset=0"), controlTowerGet<Product[]>("/api/control-tower/simple-launch/products?limit=100&offset=100")]);
    const merged = [...new Map([...(a.data ?? []), ...(b.data ?? [])].map((p) => [p.id, p])).values()].filter((p) => p.status === "ACTIVE" && p.images?.some((image) => image.publicUrl));
    setProducts(merged);
    setProductSlug((current) => current || merged[0]?.slug || "");
    if (a.status === "error" && b.status === "error") setMessage(a.message ?? b.message ?? "Could not load the SALORA catalog.");
    setLoading(false);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const product = useMemo(() => products.find((item) => item.slug === productSlug), [products, productSlug]);
  const selectedFormat = formats.find((item) => item.id === format) ?? formats[0];
  const assets = product?.images?.filter((image) => image.publicUrl) ?? [];
  const selectedAssetIds = new Set(scenes.flatMap((scene) => scene.assetIds));
  const hero = assets.find((asset) => selectedAssetIds.has(asset.id)) ?? assets.find((asset) => asset.isPrimary) ?? assets[0];
  const duration = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);

  function toggleAsset(assetId: string) {
    setScenes((current) => current.map((scene, index) => index === 0 ? { ...scene, assetIds: scene.assetIds.includes(assetId) ? scene.assetIds.filter((id) => id !== assetId) : [...scene.assetIds, assetId] } : scene));
  }
  function updateScene(index: number, patch: Partial<Scene>) { setScenes((current) => current.map((scene, i) => i === index ? { ...scene, ...patch } : scene)); }
  function addScene() { if (scenes.length < 12) setScenes((current) => [...current, { id: `scene-${Date.now()}`, title: "New scene", durationSeconds: 4, direction: "Describe the visual beat.", assetIds: [] }]); }

  async function planPreview() {
    if (!product) return;
    setMessage("Planning preview render…"); setJob(null);
    const result = await controlTowerPost<{ job: RenderJob }>("/api/control-tower/media-studio/render-jobs", { productSlug: product.slug, goal, format, creativeDirection: prompt, scenes });
    if (result.status === "success" && result.data?.job) { setJob(result.data.job); setMessage("Preview render plan created safely on the server. No Production data was changed."); }
    else setMessage(result.message ?? "Preview planning failed.");
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
    <section className="space-y-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold-soft)]">SALORA AI Media Studio · P77-B</p><h2 className="mt-2 text-xl font-semibold text-[var(--cream)]">Live catalog → storyboard → preview render plan</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Uses authenticated SALORA catalog data and approved product media. Preview planning is server-owned and cannot publish.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm"><span className="font-medium">SALORA product</span><select disabled={loading} value={productSlug} onChange={(e) => { setProductSlug(e.target.value); setScenes(initialScenes); setJob(null); }} className="min-h-11 rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3"><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.slug}>{p.nameAr || p.nameEn || p.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm"><span className="font-medium">Campaign goal</span><select value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)} className="min-h-11 rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3">{goals.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
        <label className="grid gap-2 text-sm"><span className="font-medium">Output</span><select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className="min-h-11 rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3">{formats.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
      </div>
      <label className="grid gap-2 text-sm"><span className="font-medium">Creative direction</span><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="rounded-2xl border border-[var(--border-subtle)] bg-black/20 px-4 py-3" /></label>

      <div><div className="flex items-center justify-between"><div><h3 className="font-semibold">Asset Picker</h3><p className="text-xs text-[var(--muted)]">Approved media from the selected live product.</p></div><span className="text-xs text-[var(--muted)]">{assets.length} assets</span></div><div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">{assets.map((asset) => <button type="button" key={asset.id} onClick={() => toggleAsset(asset.id)} className={`relative aspect-square overflow-hidden rounded-2xl border ${selectedAssetIds.has(asset.id) ? "border-[var(--gold)]" : "border-[var(--border-subtle)]"}`}>{asset.publicUrl ? <Image src={asset.publicUrl} alt={asset.altText || product?.name || "SALORA product"} fill unoptimized className="object-cover" /> : null}</button>)}</div></div>

      <div><div className="flex items-center justify-between"><div><h3 className="font-semibold">Storyboard Builder</h3><p className="text-xs text-[var(--muted)]">{scenes.length} scenes · {duration}s total</p></div><button type="button" onClick={addScene} className="min-h-11 rounded-xl border border-[var(--border-gold)] px-4 text-sm">+ Scene</button></div><div className="mt-3 space-y-3">{scenes.map((scene, index) => <div key={scene.id} className="grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4 sm:grid-cols-[1fr_110px]"><div className="space-y-2"><input value={scene.title} onChange={(e) => updateScene(index, { title: e.target.value })} className="w-full rounded-lg bg-black/20 px-3 py-2 font-semibold" /><textarea value={scene.direction} onChange={(e) => updateScene(index, { direction: e.target.value })} rows={2} className="w-full rounded-lg bg-black/20 px-3 py-2 text-sm" /></div><label className="text-xs text-[var(--muted)]">Seconds<input type="number" min={1} max={12} value={scene.durationSeconds} onChange={(e) => updateScene(index, { durationSeconds: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })} className="mt-2 w-full rounded-lg bg-black/20 px-3 py-2 text-[var(--cream)]" /></label></div>)}</div></div>
      <button type="button" disabled={!product || !assets.length || duration > 60} onClick={() => void planPreview()} className="min-h-11 rounded-xl bg-[var(--gold)] px-5 text-sm font-semibold text-[#17120a] disabled:opacity-50">Create Preview Render Plan</button>
      {message ? <p role="status" className="text-sm text-[var(--muted)]">{message}</p> : null}
    </section>

    <aside className="space-y-4"><div className="rounded-3xl border border-[var(--border-gold)] bg-[var(--surface)] p-5"><div className="flex justify-between text-xs text-[var(--muted)]"><span>{selectedFormat.label}</span><span>{selectedFormat.ratio}</span></div><div className="relative mt-4 aspect-[9/16] max-h-[520px] overflow-hidden rounded-2xl bg-black">{hero?.publicUrl ? <Image src={hero.publicUrl} alt={hero.altText || product?.name || "SALORA preview"} fill unoptimized className="object-cover opacity-75" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" /><div className="absolute inset-x-5 bottom-6"><p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold-soft)]">TASTE THE HARMONY</p><h3 className="mt-2 text-2xl font-semibold">{product?.nameAr || product?.nameEn || "SALORA"}</h3><p className="mt-2 text-sm text-white/70">Experimental composition: SaloraProductPreview · {duration}s</p></div></div></div>{job ? <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.05] p-5 text-sm"><strong>Server render contract ready</strong><p className="mt-2 text-[var(--muted)]">{job.id} · {job.state} · {job.sceneCount} scenes · {job.durationSeconds}s</p></div> : null}<div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 text-sm leading-6 text-[var(--muted)]">Preview only. No queue, database persistence, external AI generation, social publishing, or Production mutation is performed by P77-B.</div></aside>
  </div>;
}
