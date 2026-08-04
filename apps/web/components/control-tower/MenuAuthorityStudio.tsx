"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpenCheck, History, RefreshCw, ShieldCheck } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";

type CollectionRecord = {
  id: string;
  key: string;
  kind: string;
  status: string;
  nameAr: string;
  nameEn: string;
  completenessScore: number;
  activeRevisionId?: string | null;
  products: Array<{ product: { status: string } }>;
  sections: Array<{ id: string; key: string; nameAr: string; nameEn: string; sortOrder: number; isActive: boolean }>;
  revisions: Array<{ id: string; version: number; checksum: string; changeSummary?: string | null; createdAt: string }>;
  publications: Array<{ id: string; status: string; publicationKey: string; publishedAt?: string | null }>;
};

export function MenuAuthorityStudio() {
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [message, setMessage] = useState("Loading the governed menu workspace…");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/control-tower/menu-authority", { cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as { data?: CollectionRecord[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Unable to load menu authority.");
    setCollections(payload.data ?? []);
    setMessage("Collections, revisions and publications are synchronized from the governed domain.");
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/control-tower/menu-authority", {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as {
          data?: CollectionRecord[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load menu authority.");
        }
        return payload.data ?? [];
      })
      .then((data) => {
        setCollections(data);
        setMessage("Collections, revisions and publications are synchronized from the governed domain.");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage(error instanceof Error ? error.message : "Unable to load menu authority.");
      });

    return () => controller.abort();
  }, []);

  async function action(collectionId: string, actionName: "refresh-completeness" | "create-revision") {
    setBusy(`${collectionId}:${actionName}`);
    try {
      const payload = actionName === "create-revision"
        ? { collectionId, changeSummary: "Control Tower revision created after operator review." }
        : { collectionId };
      const response = await fetch("/api/control-tower/menu-authority", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: actionName, payload })
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Menu authority operation failed.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Menu authority operation failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="menu-authority-studio" className="scroll-mt-24 space-y-4">
      <div className="rounded-2xl border border-[var(--border-gold)] bg-[linear-gradient(135deg,rgba(201,164,92,0.13),rgba(255,255,255,0.025))] p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-[var(--border-gold)] bg-black/20 p-3 text-[var(--gold-soft)]">
            <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold-soft)]">P22 Menu Authority</p>
            <h3 className="mt-1 text-2xl font-semibold text-[var(--cream)]">Collections, revisions and publishing</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>
          </div>
        </div>
      </div>

      <DashboardGrid columns="two">
        {collections.map((collection) => {
          const active = collection.products.filter((membership) => membership.product.status === "ACTIVE").length;
          const drafts = collection.products.filter((membership) => membership.product.status === "DRAFT").length;
          const latest = collection.revisions[0];
          return (
            <DashboardCard key={collection.id} title={collection.nameEn} eyebrow={`${collection.kind} • ${collection.status}`}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Products" value={collection.products.length} />
                <Metric label="Sections" value={collection.sections.filter((section) => section.isActive).length} />
                <Metric label="Active" value={active} />
                <Metric label="Draft" value={drafts} />
                <Metric label="Completeness" value={`${collection.completenessScore}%`} />
                <Metric label="Revision" value={latest ? `v${latest.version}` : "None"} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void action(collection.id, "refresh-completeness")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-[var(--cream)] disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" /> Recalculate
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void action(collection.id, "create-revision")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--gold)] px-3 text-xs font-semibold text-black disabled:opacity-50"
                >
                  <History className="h-4 w-4" /> Create revision
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
                <ShieldCheck className="h-4 w-4 text-[var(--gold-soft)]" />
                Publish and rollback remain permission-gated and immutable.
              </div>
            </DashboardCard>
          );
        })}
      </DashboardGrid>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <span className="block text-xs text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block text-lg text-[var(--cream)]">{value}</strong>
    </div>
  );
}
