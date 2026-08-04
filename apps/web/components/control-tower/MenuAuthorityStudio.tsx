"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Eye,
  GitCompareArrows,
  History,
  ListChecks,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";

type SectionRecord = {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

type MembershipRecord = {
  id: string;
  sectionId: string | null;
  sortOrder: number;
  isFeatured: boolean;
  archivedAt: string | null;
  product: {
    id: string;
    slug: string;
    nameAr: string | null;
    nameEn: string | null;
    status: string;
    basePrice: string | number;
  };
};

type RevisionRecord = {
  id: string;
  version: number;
  status: string;
  checksum: string;
  changeSummary?: string | null;
  createdBy: string;
  createdAt: string;
};

type PublicationRecord = {
  id: string;
  status: string;
  publicationKey: string;
  channels: string[];
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  revision: {
    id: string;
    version: number;
    checksum: string;
  };
};

type CollectionRecord = {
  id: string;
  key: string;
  kind: string;
  status: string;
  nameAr: string;
  nameEn: string;
  completenessScore: number;
  updatedAt: string;
  activeRevisionId?: string | null;
  activeRevision?: {
    id: string;
    version: number;
    checksum: string;
    createdAt: string;
  } | null;
  products: MembershipRecord[];
  sections: SectionRecord[];
  revisions: RevisionRecord[];
  publications: PublicationRecord[];
};

type ValidationRecord = {
  updatedAt: string;
  counts: {
    sections: number;
    memberships: number;
    activeProducts: number;
    draftProducts: number;
  };
  completeness: {
    score: number;
    blockers: string[];
    readyForApproval: boolean;
  };
  canonicalActiveRevision: boolean;
  blockers: string[];
  warnings: string[];
  validForRevision: boolean;
  validForPublication: boolean;
};

type DiffRecord = {
  left: { version: number };
  right: { version: number };
  diff: {
    compatible: boolean;
    warnings: string[];
    summary: Record<string, number>;
    sections: {
      added: Array<{ key: string }>;
      removed: Array<{ key: string }>;
      changed: Array<{ key: string; changes?: string[] }>;
    };
    products: {
      added: Array<{ key: string }>;
      removed: Array<{ key: string }>;
      changed: Array<{ key: string; changes?: string[] }>;
    };
  };
};

type AuditRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  reason?: string | null;
  createdAt: string;
};

const tabs = [
  "Overview",
  "Section ordering",
  "Product ordering",
  "Bulk operations",
  "Revision Diff",
  "Live Preview",
  "Publishing",
  "Rollback",
  "Audit trail"
] as const;

type Tab = typeof tabs[number];

async function jsonPayload<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Menu authority request failed.");
  return payload.data as T;
}

export function MenuAuthorityStudio() {
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [tab, setTab] = useState<Tab>("Overview");
  const [message, setMessage] = useState("Loading the governed menu workspace…");
  const [busy, setBusy] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationRecord | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [diff, setDiff] = useState<DiffRecord | null>(null);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [leftRevisionId, setLeftRevisionId] = useState("");
  const [rightRevisionId, setRightRevisionId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedMembershipIds, setSelectedMembershipIds] = useState<string[]>([]);
  const [bulkType, setBulkType] = useState<"SET_FEATURED" | "MOVE_SECTION" | "SET_VISIBILITY">("SET_FEATURED");
  const [bulkSectionId, setBulkSectionId] = useState("");
  const [bulkBoolean, setBulkBoolean] = useState(true);
  const [bulkReason, setBulkReason] = useState("Approved Control Tower bulk membership operation.");
  const [revisionSummary, setRevisionSummary] = useState("");
  const [targetStatus, setTargetStatus] = useState("CONTENT_REVIEW");
  const [transitionReason, setTransitionReason] = useState("Approved Control Tower workflow transition.");
  const [publishRevisionId, setPublishRevisionId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const timezone = "Asia/Muscat";
  const [rollbackPublicationId, setRollbackPublicationId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("Approved operator rollback after review.");

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === selectedCollectionId) ?? collections[0] ?? null,
    [collections, selectedCollectionId]
  );

  const visibleMemberships = useMemo(
    () => selectedCollection?.products.filter((membership) => !membership.archivedAt) ?? [],
    [selectedCollection]
  );

  const sectionMemberships = useMemo(
    () => visibleMemberships
      .filter((membership) => membership.sectionId === (selectedSectionId || null))
      .sort((left, right) => left.sortOrder - right.sortOrder),
    [visibleMemberships, selectedSectionId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/control-tower/menu-authority", {
      cache: "no-store",
      signal: controller.signal
    })
      .then((response) => jsonPayload<CollectionRecord[]>(response))
      .then((data) => {
        setCollections(data);
        setSelectedCollectionId((current) => current || data[0]?.id || "");
        setSelectedSectionId((current) => current || data[0]?.sections[0]?.id || "");
        setPublishRevisionId((current) => current || data[0]?.revisions[0]?.id || "");
        setRollbackPublicationId((current) => current || data[0]?.publications[0]?.id || "");
        setMessage("Collections, revisions and publications are synchronized from the governed domain.");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage(error instanceof Error ? error.message : "Unable to load menu authority.");
      });
    return () => controller.abort();
  }, []);

  async function refreshWorkspace(preferredCollectionId = selectedCollectionId) {
    const response = await fetch("/api/control-tower/menu-authority", { cache: "no-store" });
    const data = await jsonPayload<CollectionRecord[]>(response);
    setCollections(data);
    const collection = data.find((item) => item.id === preferredCollectionId) ?? data[0];
    setSelectedCollectionId(collection?.id ?? "");
    setSelectedSectionId((current) =>
      collection?.sections.some((section) => section.id === current)
        ? current
        : collection?.sections[0]?.id ?? ""
    );
    setPublishRevisionId((current) =>
      collection?.revisions.some((revision) => revision.id === current)
        ? current
        : collection?.revisions[0]?.id ?? ""
    );
    setRollbackPublicationId((current) =>
      collection?.publications.some((publication) => publication.id === current)
        ? current
        : collection?.publications[0]?.id ?? ""
    );
  }

  async function post(action: string, payload: unknown) {
    setBusy(action);
    try {
      const response = await fetch("/api/control-tower/menu-authority", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, payload })
      });
      const result = await jsonPayload<unknown>(response);
      await refreshWorkspace();
      setSelectedMembershipIds([]);
      setMessage(`${action} completed successfully.`);
      return result;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Menu authority operation failed.");
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  async function runValidation(revisionId?: string) {
    if (!selectedCollection) return null;
    setBusy("validation");
    try {
      const response = await fetch(
        `/api/control-tower/menu-authority?view=validation&collectionId=${encodeURIComponent(selectedCollection.id)}${revisionId ? `&revisionId=${encodeURIComponent(revisionId)}` : ""}`,
        { cache: "no-store" }
      );
      const data = await jsonPayload<ValidationRecord>(response);
      setValidation(data);
      setMessage(data.validForPublication
        ? "Live validation passed for publication."
        : `Live validation found ${data.blockers.length} blocker(s).`
      );
      return data;
    } finally {
      setBusy(null);
    }
  }

  async function loadPreview() {
    if (!selectedCollection) return;
    setBusy("preview");
    try {
      const response = await fetch(
        `/api/control-tower/menu-authority?view=preview&collectionId=${encodeURIComponent(selectedCollection.id)}`,
        { cache: "no-store" }
      );
      setPreview(await jsonPayload<Record<string, unknown>>(response));
      setTab("Live Preview");
    } finally {
      setBusy(null);
    }
  }

  async function loadDiff() {
    if (!selectedCollection || !leftRevisionId || !rightRevisionId) return;
    setBusy("diff");
    try {
      const params = new URLSearchParams({
        view: "diff",
        collectionId: selectedCollection.id,
        leftRevisionId,
        rightRevisionId
      });
      const response = await fetch(`/api/control-tower/menu-authority?${params}`, { cache: "no-store" });
      setDiff(await jsonPayload<DiffRecord>(response));
    } finally {
      setBusy(null);
    }
  }

  async function loadAudit() {
    setBusy("audit");
    try {
      const response = await fetch("/api/control-tower/menu-authority?view=audit", { cache: "no-store" });
      setAudit(await jsonPayload<AuditRecord[]>(response));
      setTab("Audit trail");
    } finally {
      setBusy(null);
    }
  }

  async function moveSection(index: number, direction: -1 | 1) {
    if (!selectedCollection) return;
    const ordered = [...selectedCollection.sections].sort((left, right) => left.sortOrder - right.sortOrder);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const currentSection = ordered[index];
    const targetSection = ordered[target];
    if (!currentSection || !targetSection) return;
    ordered[index] = targetSection;
    ordered[target] = currentSection;
    await post("reorder-sections", {
      collectionId: selectedCollection.id,
      expectedUpdatedAt: selectedCollection.updatedAt,
      items: ordered.map((section, position) => ({
        id: section.id,
        sortOrder: (position + 1) * 10
      }))
    });
  }

  async function moveProduct(index: number, direction: -1 | 1) {
    if (!selectedCollection) return;
    const ordered = [...sectionMemberships];
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const currentMembership = ordered[index];
    const targetMembership = ordered[target];
    if (!currentMembership || !targetMembership) return;
    ordered[index] = targetMembership;
    ordered[target] = currentMembership;
    await post("reorder-products", {
      collectionId: selectedCollection.id,
      sectionId: selectedSectionId || null,
      expectedUpdatedAt: selectedCollection.updatedAt,
      items: ordered.map((membership, position) => ({
        id: membership.id,
        sortOrder: (position + 1) * 10
      }))
    });
  }

  function toggleMembership(id: string) {
    setSelectedMembershipIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function applyBulk() {
    if (!selectedCollection || selectedMembershipIds.length === 0) return;
    const operation = bulkType === "MOVE_SECTION"
      ? { type: bulkType, sectionId: bulkSectionId }
      : bulkType === "SET_FEATURED"
        ? { type: bulkType, isFeatured: bulkBoolean }
        : { type: bulkType, visible: bulkBoolean };
    await post("bulk-memberships", {
      collectionId: selectedCollection.id,
      expectedUpdatedAt: selectedCollection.updatedAt,
      membershipIds: selectedMembershipIds,
      operation,
      reason: bulkReason
    });
  }

  async function createRevision() {
    if (!selectedCollection) return;
    const result = await runValidation();
    if (!result?.validForRevision) return;
    await post("create-revision", {
      collectionId: selectedCollection.id,
      expectedUpdatedAt: selectedCollection.updatedAt,
      changeSummary: revisionSummary || "Control Tower immutable revision after live validation."
    });
  }

  async function transition() {
    if (!selectedCollection) return;
    await post("transition", {
      collectionId: selectedCollection.id,
      expectedUpdatedAt: selectedCollection.updatedAt,
      targetStatus,
      reason: transitionReason
    });
  }

  async function publish(immediate: boolean) {
    if (!selectedCollection || !publishRevisionId) return;
    const result = await runValidation(publishRevisionId);
    if (!result?.validForPublication) return;
    const date = immediate ? null : scheduledAt ? new Date(`${scheduledAt}:00+04:00`) : null;
    await post("publish", {
      collectionId: selectedCollection.id,
      revisionId: publishRevisionId,
      publicationKey: `${selectedCollection.key}:${Date.now()}`,
      channels: ["WEB", "DIGITAL_MENU", "MOBILE"],
      scheduledAt: date?.toISOString() ?? null,
      timezone,
      expectedUpdatedAt: selectedCollection.updatedAt
    });
  }

  async function rollback() {
    if (!selectedCollection || !rollbackPublicationId) return;
    await post("rollback", {
      collectionId: selectedCollection.id,
      targetPublicationId: rollbackPublicationId,
      reason: rollbackReason,
      expectedUpdatedAt: selectedCollection.updatedAt
    });
  }

  if (!selectedCollection) {
    return (
      <section id="menu-authority-studio" className="rounded-2xl border border-white/10 p-6">
        <p className="text-sm text-[var(--muted)]">{message}</p>
      </section>
    );
  }

  return (
    <section id="menu-authority-studio" className="scroll-mt-24 space-y-4">
      <div className="rounded-2xl border border-[var(--border-gold)] bg-[linear-gradient(135deg,rgba(201,164,92,0.13),rgba(255,255,255,0.025))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl border border-[var(--border-gold)] bg-black/20 p-3 text-[var(--gold-soft)]">
              <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold-soft)]">P22B Operator Workflow</p>
              <h3 className="mt-1 text-2xl font-semibold text-[var(--cream)]">Collections, revisions and publishing</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{message}</p>
            </div>
          </div>
          <select
            aria-label="Select menu collection"
            value={selectedCollection.id}
            onChange={(event) => {
              const id = event.target.value;
              const collection = collections.find((item) => item.id === id);
              setSelectedCollectionId(id);
              setSelectedSectionId(collection?.sections[0]?.id ?? "");
              setPublishRevisionId(collection?.revisions[0]?.id ?? "");
              setRollbackPublicationId(collection?.publications[0]?.id ?? "");
              setValidation(null);
              setDiff(null);
              setPreview(null);
            }}
            className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
          >
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.nameEn} • {collection.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`min-h-11 shrink-0 rounded-xl px-3 text-xs font-semibold ${
              tab === item ? "bg-[var(--gold)] text-black" : "text-[var(--muted)] hover:bg-white/5"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <DashboardGrid columns="two">
          <DashboardCard title={selectedCollection.nameEn} eyebrow={`${selectedCollection.kind} • ${selectedCollection.status}`}>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Products" value={visibleMemberships.length} />
              <Metric label="Sections" value={selectedCollection.sections.length} />
              <Metric label="Completeness" value={`${selectedCollection.completenessScore}%`} />
              <Metric label="Active revision" value={selectedCollection.activeRevision ? `v${selectedCollection.activeRevision.version}` : "None"} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <ActionButton
                icon={<ListChecks className="h-4 w-4" />}
                label="Live validation"
                disabled={Boolean(busy)}
                onClick={() => void runValidation()}
              />
              <ActionButton
                icon={<Eye className="h-4 w-4" />}
                label="Live Preview"
                disabled={Boolean(busy)}
                onClick={() => void loadPreview()}
              />
              <ActionButton
                icon={<RefreshCw className="h-4 w-4" />}
                label="Recalculate"
                disabled={Boolean(busy)}
                onClick={() => void post("refresh-completeness", { collectionId: selectedCollection.id })}
              />
            </div>
          </DashboardCard>

          <DashboardCard title="Live validation" eyebrow="Publication gate">
            {validation ? (
              <div className="space-y-3 text-sm">
                <p className={validation.validForPublication ? "text-emerald-300" : "text-amber-300"}>
                  {validation.validForPublication ? "Ready for publication" : "Publication blocked"}
                </p>
                <p className="text-[var(--muted)]">
                  {validation.counts.activeProducts} active • {validation.counts.draftProducts} draft • {validation.counts.sections} sections
                </p>
                {validation.blockers.map((blocker) => (
                  <p key={blocker} className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-2 text-xs text-amber-200">
                    {blocker}
                  </p>
                ))}
                {validation.warnings.map((warning) => (
                  <p key={warning} className="text-xs text-[var(--muted)]">{warning}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Run validation before creating or publishing a revision.</p>
            )}
          </DashboardCard>

          <DashboardCard title="Workflow transition" eyebrow="RBAC governed">
            <div className="space-y-3">
              <select
                value={targetStatus}
                onChange={(event) => setTargetStatus(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
              >
                {["DRAFT", "CONTENT_REVIEW", "FOOD_SAFETY_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "PAUSED", "ARCHIVED"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <textarea
                value={transitionReason}
                onChange={(event) => setTransitionReason(event.target.value)}
                className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-[var(--cream)]"
              />
              <ActionButton
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Apply transition"
                disabled={Boolean(busy)}
                onClick={() => void transition()}
              />
            </div>
          </DashboardCard>

          <DashboardCard title="Create immutable revision" eyebrow="Validated snapshot">
            <textarea
              value={revisionSummary}
              onChange={(event) => setRevisionSummary(event.target.value)}
              placeholder="Describe the approved changes."
              className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-[var(--cream)]"
            />
            <div className="mt-3">
              <ActionButton
                icon={<History className="h-4 w-4" />}
                label="Validate and create revision"
                disabled={Boolean(busy)}
                onClick={() => void createRevision()}
              />
            </div>
          </DashboardCard>
        </DashboardGrid>
      )}

      {tab === "Section ordering" && (
        <DashboardCard title="Section ordering" eyebrow="Optimistic concurrency">
          <div className="space-y-2">
            {[...selectedCollection.sections]
              .sort((left, right) => left.sortOrder - right.sortOrder)
              .map((section, index, ordered) => (
                <div key={section.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                  <div>
                    <strong className="text-sm text-[var(--cream)]">{section.nameEn}</strong>
                    <p className="text-xs text-[var(--muted)]">{section.nameAr} • {section.key}</p>
                  </div>
                  <div className="flex gap-2">
                    <IconButton label="Move section up" disabled={index === 0 || Boolean(busy)} onClick={() => void moveSection(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Move section down" disabled={index === ordered.length - 1 || Boolean(busy)} onClick={() => void moveSection(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              ))}
          </div>
        </DashboardCard>
      )}

      {tab === "Product ordering" && (
        <DashboardCard title="Product ordering" eyebrow="Section-scoped save">
          <select
            value={selectedSectionId}
            onChange={(event) => setSelectedSectionId(event.target.value)}
            className="mb-4 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
          >
            {selectedCollection.sections.map((section) => (
              <option key={section.id} value={section.id}>{section.nameEn}</option>
            ))}
          </select>
          <div className="max-h-[620px] space-y-2 overflow-y-auto">
            {sectionMemberships.map((membership, index) => (
              <div key={membership.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                <div>
                  <strong className="text-sm text-[var(--cream)]">{membership.product.nameEn ?? membership.product.slug}</strong>
                  <p className="text-xs text-[var(--muted)]">{membership.product.nameAr} • {membership.product.status}</p>
                </div>
                <div className="flex gap-2">
                  <IconButton label="Move product up" disabled={index === 0 || Boolean(busy)} onClick={() => void moveProduct(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Move product down" disabled={index === sectionMemberships.length - 1 || Boolean(busy)} onClick={() => void moveProduct(index, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {tab === "Bulk operations" && (
        <DashboardGrid columns="two">
          <DashboardCard title="Bulk operations" eyebrow="Memberships only">
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {selectedCollection.products.map((membership) => (
                <label key={membership.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <input
                    type="checkbox"
                    checked={selectedMembershipIds.includes(membership.id)}
                    onChange={() => toggleMembership(membership.id)}
                  />
                  <span className="text-sm text-[var(--cream)]">
                    {membership.product.nameEn ?? membership.product.slug}
                    {membership.archivedAt ? " • Hidden" : ""}
                  </span>
                </label>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard title="Bulk action" eyebrow={`${selectedMembershipIds.length} selected`}>
            <div className="space-y-3">
              <select
                value={bulkType}
                onChange={(event) => setBulkType(event.target.value as typeof bulkType)}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
              >
                <option value="SET_FEATURED">Set featured</option>
                <option value="MOVE_SECTION">Move section</option>
                <option value="SET_VISIBILITY">Set visibility</option>
              </select>

              {bulkType === "MOVE_SECTION" ? (
                <select
                  value={bulkSectionId}
                  onChange={(event) => setBulkSectionId(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
                >
                  <option value="">Choose section</option>
                  {selectedCollection.sections.map((section) => (
                    <option key={section.id} value={section.id}>{section.nameEn}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={bulkBoolean ? "true" : "false"}
                  onChange={(event) => setBulkBoolean(event.target.value === "true")}
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
                >
                  <option value="true">{bulkType === "SET_FEATURED" ? "Featured" : "Visible"}</option>
                  <option value="false">{bulkType === "SET_FEATURED" ? "Not featured" : "Hidden"}</option>
                </select>
              )}

              <textarea
                value={bulkReason}
                onChange={(event) => setBulkReason(event.target.value)}
                className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-[var(--cream)]"
              />
              <ActionButton
                icon={<Save className="h-4 w-4" />}
                label="Apply bulk operation"
                disabled={Boolean(busy) || selectedMembershipIds.length === 0 || (bulkType === "MOVE_SECTION" && !bulkSectionId)}
                onClick={() => void applyBulk()}
              />
              <p className="text-xs leading-5 text-[var(--muted)]">
                These operations never modify catalog prices, product status, media, inventory, orders or customer data.
              </p>
            </div>
          </DashboardCard>
        </DashboardGrid>
      )}

      {tab === "Revision Diff" && (
        <DashboardGrid columns="two">
          <DashboardCard title="Revision Diff Viewer" eyebrow="Any two revisions">
            <div className="space-y-3">
              <RevisionSelect revisions={selectedCollection.revisions} value={leftRevisionId} onChange={setLeftRevisionId} label="Left revision" />
              <RevisionSelect revisions={selectedCollection.revisions} value={rightRevisionId} onChange={setRightRevisionId} label="Right revision" />
              <ActionButton
                icon={<GitCompareArrows className="h-4 w-4" />}
                label="Compare revisions"
                disabled={Boolean(busy) || !leftRevisionId || !rightRevisionId || leftRevisionId === rightRevisionId}
                onClick={() => void loadDiff()}
              />
            </div>
          </DashboardCard>
          <DashboardCard title="Diff result" eyebrow={diff ? `v${diff.left.version} → v${diff.right.version}` : "Waiting"}>
            {diff ? (
              <div className="space-y-3 text-sm">
                {Object.entries(diff.diff.summary).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-white/10 py-2">
                    <span className="text-[var(--muted)]">{key}</span>
                    <strong className="text-[var(--cream)]">{value}</strong>
                  </div>
                ))}
                {diff.diff.warnings.map((warning) => (
                  <p key={warning} className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-2 text-xs text-amber-200">
                    {warning}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Choose two immutable revisions to compare.</p>
            )}
          </DashboardCard>
        </DashboardGrid>
      )}

      {tab === "Live Preview" && (
        <DashboardCard title="Live Preview" eyebrow="Canonical snapshot builder">
          <div className="mb-4">
            <ActionButton
              icon={<Eye className="h-4 w-4" />}
              label="Refresh preview"
              disabled={Boolean(busy)}
              onClick={() => void loadPreview()}
            />
          </div>
          {preview ? (
            <pre className="max-h-[680px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-[var(--muted)]">
              {JSON.stringify(preview, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-[var(--muted)]">Generate a preview before creating the immutable revision.</p>
          )}
        </DashboardCard>
      )}

      {tab === "Publishing" && (
        <DashboardGrid columns="two">
          <DashboardCard title="Publishing" eyebrow="Permission-gated">
            <div className="space-y-3">
              <RevisionSelect revisions={selectedCollection.revisions} value={publishRevisionId} onChange={setPublishRevisionId} label="Revision to publish" />
              <label className="block text-xs text-[var(--muted)]">
                Scheduled local time
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
                />
              </label>
              <p className="text-xs text-[var(--muted)]">Timezone: {timezone}</p>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Publish now"
                  disabled={Boolean(busy)}
                  onClick={() => void publish(true)}
                />
                <ActionButton
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Schedule publication"
                  disabled={Boolean(busy) || !scheduledAt}
                  onClick={() => void publish(false)}
                />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Version history" eyebrow="Immutable revisions">
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {selectedCollection.revisions.map((revision) => (
                <div key={revision.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex justify-between">
                    <strong className="text-sm text-[var(--cream)]">Revision v{revision.version}</strong>
                    <span className="text-xs text-[var(--gold-soft)]">{revision.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">{revision.changeSummary ?? "No summary"}</p>
                  <p className="mt-2 font-mono text-[10px] text-[var(--muted)]">{revision.checksum.slice(0, 16)}…</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </DashboardGrid>
      )}

      {tab === "Rollback" && (
        <DashboardGrid columns="two">
          <DashboardCard title="Rollback" eyebrow="Permission-gated">
            <select
              value={rollbackPublicationId}
              onChange={(event) => setRollbackPublicationId(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
            >
              {selectedCollection.publications.map((publication) => (
                <option key={publication.id} value={publication.id}>
                  v{publication.revision.version} • {publication.status} • {publication.publicationKey}
                </option>
              ))}
            </select>
            <textarea
              value={rollbackReason}
              onChange={(event) => setRollbackReason(event.target.value)}
              className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-[var(--cream)]"
            />
            <div className="mt-3">
              <ActionButton
                icon={<RotateCcw className="h-4 w-4" />}
                label="Rollback to selected publication"
                disabled={Boolean(busy) || !rollbackPublicationId}
                onClick={() => void rollback()}
              />
            </div>
          </DashboardCard>

          <DashboardCard title="Publication history" eyebrow="Rollback evidence">
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {selectedCollection.publications.map((publication) => (
                <div key={publication.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <strong className="text-sm text-[var(--cream)]">v{publication.revision.version}</strong>
                  <p className="text-xs text-[var(--muted)]">{publication.status} • {publication.publicationKey}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {publication.publishedAt ? new Date(publication.publishedAt).toLocaleString() : "Scheduled"}
                  </p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </DashboardGrid>
      )}

      {tab === "Audit trail" && (
        <DashboardCard title="Audit trail" eyebrow="Latest 100 menu events">
          <div className="mb-4">
            <ActionButton
              icon={<History className="h-4 w-4" />}
              label="Refresh audit trail"
              disabled={Boolean(busy)}
              onClick={() => void loadAudit()}
            />
          </div>
          <div className="max-h-[680px] space-y-2 overflow-y-auto">
            {audit.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong className="text-sm text-[var(--cream)]">{item.action} • {item.entityType}</strong>
                  <span className="text-xs text-[var(--muted)]">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.reason ?? "No reason recorded."}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
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

function ActionButton({
  icon,
  label,
  disabled,
  onClick
}: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--gold)] px-3 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}

function IconButton({
  children,
  label,
  disabled,
  onClick
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 text-[var(--cream)] disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function RevisionSelect({
  revisions,
  value,
  onChange,
  label
}: {
  revisions: RevisionRecord[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="block text-xs text-[var(--muted)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--cream)]"
      >
        <option value="">Choose revision</option>
        {revisions.map((revision) => (
          <option key={revision.id} value={revision.id}>
            v{revision.version} • {revision.status}
          </option>
        ))}
      </select>
    </label>
  );
}
