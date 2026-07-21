"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, FilePlus2, History, RotateCcw, Save, Send, ShieldCheck } from "lucide-react";
import { useControlTowerLocale } from "./ControlTowerLocale";

type Revision = { id: string; version: number; payload: Record<string, unknown>; changeSummary?: string; createdAt: string };
type Approval = { id: string; status: string; decisionNote?: string; requestedAt: string };
type Document = { id: string; resourceType: string; key: string; slug?: string; titleAr: string; titleEn: string; status: string; activeRevisionId?: string; scheduledAt?: string; revisions: Revision[]; approvals: Approval[] };

const types = ["PAGE", "SECTION", "NAVIGATION", "BANNER", "CAMPAIGN", "LANDING_PAGE"] as const;
const statusTone: Record<string, string> = { PUBLISHED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200", APPROVED: "border-sky-500/30 bg-sky-500/10 text-sky-200", IN_REVIEW: "border-amber-500/30 bg-amber-500/10 text-amber-100", SCHEDULED: "border-violet-500/30 bg-violet-500/10 text-violet-100", ARCHIVED: "border-white/10 bg-white/5 text-white/50", DRAFT: "border-white/15 bg-white/5 text-white/70" };

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Request failed");
  return body.data;
}

export function ContentOperationsStudio() {
  const { isArabic } = useControlTowerLocale();
  const t = useCallback((ar: string, en: string) => isArabic ? ar : en, [isArabic]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState<Document | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ resourceType: "PAGE", key: "", slug: "", titleAr: "", titleEn: "", payload: "{\n  \"blocks\": []\n}", changeSummary: "" });
  const [schedule, setSchedule] = useState("");
  const [decisionNote, setDecisionNote] = useState("");

  const load = useCallback(async () => {
    const rows = await api("/api/control-tower/content-studio");
    setDocuments(rows);
  }, []);

  const open = useCallback(async (id: string) => {
    const detail = await api(`/api/control-tower/content-studio?documentId=${id}`);
    const document = detail.document as Document;
    setSelected(document);
    const active = document.revisions.find((revision) => revision.id === document.activeRevisionId) ?? document.revisions[0];
    setForm({ resourceType: document.resourceType, key: document.key, slug: document.slug ?? "", titleAr: document.titleAr, titleEn: document.titleEn, payload: JSON.stringify(active?.payload ?? {}, null, 2), changeSummary: "" });
    setCreating(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load().catch((cause) => setError(cause.message)), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const pendingApproval = selected?.approvals.find((approval) => approval.status === "PENDING");
  const activeRevision = useMemo(() => selected?.revisions.find((revision) => revision.id === selected.activeRevisionId) ?? selected?.revisions[0], [selected]);

  async function mutate(input: Record<string, unknown>) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await api("/api/control-tower/content-studio", { method: "PATCH", body: JSON.stringify(input) });
      setMessage(t("تم تنفيذ العملية وتسجيلها في سجل التدقيق.", "Operation completed and recorded in the audit trail."));
      await load();
      const id = (result.document?.id ?? result.id ?? selected?.id) as string | undefined;
      if (id) await open(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("تعذر تنفيذ العملية.", "Operation failed."));
    } finally { setBusy(false); }
  }

  function parsedPayload() {
    try { return JSON.parse(form.payload) as Record<string, unknown>; }
    catch { throw new Error(t("صيغة محتوى JSON غير صحيحة.", "Content JSON is invalid.")); }
  }

  async function save() {
    try {
      const content = parsedPayload();
      if (creating) {
        await mutate({ action: "create", resourceType: form.resourceType, key: form.key, slug: form.slug || undefined, titleAr: form.titleAr, titleEn: form.titleEn, payload: content, changeSummary: form.changeSummary });
      } else if (selected) {
        await mutate({ action: "save", documentId: selected.id, slug: form.slug || null, titleAr: form.titleAr, titleEn: form.titleEn, payload: content, changeSummary: form.changeSummary });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Invalid payload"); }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-[var(--border-gold)] bg-[rgba(12,12,12,.92)] p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--gold-soft)]">SALORA CMS</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--cream)]">{t("استوديو إدارة المحتوى والنشر", "Content & publishing studio")}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{t("إدارة الصفحات والتنقل والبنرات والحملات بإصدارات وموافقات وجدولة واسترجاع دون تعديل الكود.", "Manage pages, navigation, banners and campaigns with revisions, approvals, scheduling and rollback—without code changes.")}</p>
        </div>
        <button onClick={() => { setCreating(true); setSelected(null); setForm({ resourceType: "PAGE", key: "", slug: "", titleAr: "", titleEn: "", payload: "{\n  \"blocks\": []\n}", changeSummary: "" }); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-3 text-sm font-bold text-black"><FilePlus2 className="h-4 w-4" />{t("محتوى جديد", "New content")}</button>
      </div>

      {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>{error || message}</div>}

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="max-h-[720px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold text-[var(--cream)]">{t("سجل المحتوى", "Content registry")}</span><span className="text-xs text-[var(--muted)]">{documents.length}</span></div>
          {documents.map((document) => <button key={document.id} onClick={() => open(document.id).catch((cause) => setError(cause.message))} className={`w-full rounded-xl border p-3 text-start transition ${selected?.id === document.id ? "border-[var(--gold)] bg-[rgba(201,164,92,.1)]" : "border-white/10 bg-white/[.025] hover:border-white/20"}`}>
            <div className="flex items-start justify-between gap-2"><strong className="text-sm text-[var(--cream)]">{isArabic ? document.titleAr : document.titleEn}</strong><span className={`rounded-full border px-2 py-1 text-[10px] ${statusTone[document.status] ?? statusTone.DRAFT}`}>{document.status}</span></div>
            <p className="mt-2 text-xs text-[var(--muted)]">{document.resourceType} · {document.key}</p>
          </button>)}
        </aside>

        <div className="space-y-5 rounded-xl border border-white/10 bg-black/20 p-4">
          {!selected && !creating ? <div className="grid min-h-80 place-items-center text-center text-sm text-[var(--muted)]"><div><ShieldCheck className="mx-auto mb-3 h-8 w-8 text-[var(--gold-soft)]" /><p>{t("اختر عنصرًا أو أنشئ محتوى جديدًا.", "Select an item or create new content.")}</p></div></div> : <>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-xs text-[var(--muted)]">{t("النوع", "Type")}<select disabled={!creating} value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white">{types.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="space-y-2 text-xs text-[var(--muted)]">{t("المفتاح الثابت", "Stable key")}<input disabled={!creating} value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white" /></label>
              <label className="space-y-2 text-xs text-[var(--muted)]">{t("العنوان العربي", "Arabic title")}<input value={form.titleAr} onChange={(event) => setForm({ ...form, titleAr: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white" /></label>
              <label className="space-y-2 text-xs text-[var(--muted)]">{t("العنوان الإنجليزي", "English title")}<input value={form.titleEn} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white" /></label>
              <label className="space-y-2 text-xs text-[var(--muted)]">Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white" /></label>
              <label className="space-y-2 text-xs text-[var(--muted)]">{t("ملخص التغيير", "Change summary")}<input value={form.changeSummary} onChange={(event) => setForm({ ...form, changeSummary: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white" /></label>
            </div>
            <label className="block space-y-2 text-xs text-[var(--muted)]">{t("بنية المحتوى (JSON)", "Content structure (JSON)")}<textarea dir="ltr" value={form.payload} onChange={(event) => setForm({ ...form, payload: event.target.value })} className="min-h-64 w-full rounded-xl border border-white/10 bg-[#090909] p-4 font-mono text-xs leading-6 text-emerald-100" /></label>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50"><Save className="h-4 w-4" />{t("حفظ مسودة", "Save draft")}</button>
              {selected && <button disabled={busy} onClick={() => mutate({ action: "submit", documentId: selected.id, note: decisionNote || undefined })} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white"><Send className="h-4 w-4" />{t("إرسال للموافقة", "Submit for approval")}</button>}
              {selected && pendingApproval && <><button disabled={busy} onClick={() => mutate({ action: "approve", documentId: selected.id, approvalId: pendingApproval.id, note: decisionNote || t("تمت المراجعة والموافقة", "Reviewed and approved") })} className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100"><CheckCircle2 className="h-4 w-4" />{t("موافقة", "Approve")}</button><button disabled={busy} onClick={() => mutate({ action: "reject", documentId: selected.id, approvalId: pendingApproval.id, note: decisionNote || t("يتطلب تعديلات", "Changes required") })} className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm text-red-200">{t("رفض", "Reject")}</button></>}
              {selected?.status === "APPROVED" && <button disabled={busy} onClick={() => mutate({ action: "publish", documentId: selected.id })} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm text-sky-100">{t("نشر الآن", "Publish now")}</button>}
            </div>
            {selected && <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder={t("ملاحظة الموافقة أو سبب الإجراء", "Approval note or action reason")} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white" />
              <div className="flex gap-2"><input type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white" /><button disabled={!schedule || selected.status !== "APPROVED"} onClick={() => mutate({ action: "schedule", documentId: selected.id, scheduledAt: new Date(schedule).toISOString() })} className="inline-flex items-center gap-2 rounded-lg border border-violet-500/30 px-3 text-sm text-violet-100 disabled:opacity-40"><Clock3 className="h-4 w-4" />{t("جدولة", "Schedule")}</button></div>
            </div>}

            {selected && <div className="border-t border-white/10 pt-5"><h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--cream)]"><History className="h-4 w-4" />{t("الإصدارات والاسترجاع", "Versions & rollback")}</h4><div className="grid gap-2 sm:grid-cols-2">{selected.revisions.map((revision) => <div key={revision.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3"><div><strong className="text-sm text-white">v{revision.version}</strong><p className="mt-1 text-xs text-[var(--muted)]">{revision.changeSummary || new Date(revision.createdAt).toLocaleString(isArabic ? "ar-OM" : "en-GB")}</p></div><button disabled={revision.id === activeRevision?.id || busy} onClick={() => mutate({ action: "rollback", documentId: selected.id, revisionId: revision.id, reason: decisionNote || t("استرجاع إصدار سابق", "Restore previous version") })} title={t("استرجاع كمسودة جديدة", "Restore as a new draft")} className="rounded-lg border border-white/10 p-2 text-[var(--gold-soft)] disabled:opacity-30"><RotateCcw className="h-4 w-4" /></button></div>)}</div></div>}
          </>}
        </div>
      </div>
    </section>
  );
}
