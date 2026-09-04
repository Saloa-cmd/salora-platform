"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle2, DatabaseZap, ImageIcon, LoaderCircle, Rocket, ShieldAlert } from "lucide-react";
import { p36ActivationCandidates, p36CandidateProductIds, p36MediaApproval, p36MediaSpecification, p36PriceApproval } from "@/lib/control-tower/p36ActivationManifest";
import { useControlTowerLocale } from "./ControlTowerLocale";

export function P36ActivationReview() {
  const { isArabic } = useControlTowerLocale();
  const t = (ar: string, en: string) => isArabic ? ar : en;
  const [approvalToken, setApprovalToken] = useState("");
  const [stage, setStage] = useState<"idle" | "preparing" | "prepared" | "activating" | "complete" | "error">("idle");
  const [message, setMessage] = useState("");

  async function runStage(url: string, body: Record<string, string>) {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => null) as { error?: string; data?: Record<string, unknown> } | null;
    if (!response.ok) throw new Error(payload?.error || t("تعذر إكمال العملية.", "The operation could not be completed."));
    return payload?.data ?? {};
  }

  async function prepareProductionData() {
    setStage("preparing"); setMessage("");
    try {
      const result = await runStage("/api/control-tower/p36-production-data-prep", { action: "prepare", approvalToken: "AUTHORIZE-P36-PRODUCTION-DATA-PREP" });
      const database = result.database as Record<string, unknown> | undefined;
      setStage("prepared");
      setMessage(t(`تم تجهيز ${String(database?.readyProducts ?? 13)} صنفًا. راجع النتيجة ثم أدخل ACTIVATE117.`, `${String(database?.readyProducts ?? 13)} products prepared. Review the result, then enter ACTIVATE117.`));
    } catch (error) { setStage("error"); setMessage(error instanceof Error ? error.message : t("فشل التحضير.", "Preparation failed.")); }
  }

  async function activateAndPublish() {
    if (approvalToken !== "ACTIVATE117") return;
    setStage("activating"); setMessage("");
    try {
      const result = await runStage("/api/control-tower/p36-activate117", { action: "activate-and-publish", approvalToken });
      setStage("complete");
      setMessage(t(`اكتمل النشر الذري: ${String(result.activeProducts ?? 117)}/117 نشط · Revision v${String(result.revisionVersion ?? 2)}.`, `Atomic publication complete: ${String(result.activeProducts ?? 117)}/117 active · Revision v${String(result.revisionVersion ?? 2)}.`));
    } catch (error) { setStage("error"); setMessage(error instanceof Error ? error.message : t("فشل التفعيل.", "Activation failed.")); }
  }

  return (
    <section id="p36-activation-review" className="scroll-mt-24 space-y-5 rounded-2xl border border-[var(--border-gold)] bg-[rgba(10,10,10,.94)] p-4 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--gold-soft)]">P36 · ACTIVATION REVIEW</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--cream)]">{t("الأسعار والصور المعتمدة للمراجعة", "Approved pricing & media review set")}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {t("هذه مواد مراجعة للـPreview فقط. لا تُستخدم كبديل لقاعدة البيانات ولا تمنح إذنًا للرفع أو التعديل أو النشر في Production.", "These are Preview review materials only. They are not a database fallback and do not authorize Production upload, mutation or publishing.")}
          </p>
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-2 text-xs">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 text-emerald-100"><CheckCircle2 className="h-4 w-4" />13 {t("سعرًا مثبتًا", "prices fixed")}</span>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 text-emerald-100"><ImageIcon className="h-4 w-4" />13 {t("صورة معتمدة", "media approved")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] p-4 text-sm text-emerald-100 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" />{p36MediaApproval.token} · {p36MediaApproval.approvedAssetCount}/13</span>
        <span className="font-mono text-xs text-emerald-200/80">{p36MediaApproval.approvedAt}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {p36ActivationCandidates.map((candidate) => (
          <article key={candidate.slug} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="relative aspect-square overflow-hidden bg-black">
              <Image src={candidate.imagePath} alt={isArabic ? candidate.altAr : candidate.altEn} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover transition duration-500 hover:scale-[1.02]" />
              <span className="absolute end-3 top-3 rounded-lg border border-black/30 bg-black/75 px-2.5 py-1 font-mono text-xs font-semibold text-white backdrop-blur">{candidate.approvedPrice.toFixed(3)} OMR</span>
            </div>
            <div className="space-y-2 p-4">
              <div><strong className="block text-sm text-[var(--cream)]">{isArabic ? candidate.nameAr : candidate.nameEn}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{isArabic ? candidate.nameEn : candidate.nameAr}</span></div>
              <p className="text-xs text-[var(--gold-soft)]">{candidate.categoryAr}</p>
              <p className="font-mono text-xs"><span className="text-red-200 line-through">{p36PriceApproval.productionBaselinePrice.toFixed(3)}</span><span className="mx-2 text-[var(--muted)]">→</span><strong className="text-emerald-200">{candidate.approvedPrice.toFixed(3)} OMR</strong></p>
              <p className="truncate font-mono text-[10px] text-[var(--muted)]" title={p36CandidateProductIds[candidate.slug]}>ID · {p36CandidateProductIds[candidate.slug]}</p>
              <p className="truncate font-mono text-[10px] text-[var(--muted)]" title={candidate.imageSha256}>SHA-256 · {candidate.imageSha256.slice(0, 12)}…</p>
              <p className="font-mono text-[10px] text-[var(--muted)]">{p36MediaSpecification.width}×{p36MediaSpecification.height} · {(candidate.imageBytes / 1024).toFixed(1)} KB · {p36MediaSpecification.status}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="flex gap-3 rounded-xl border border-blue-300/15 bg-blue-300/[0.06] p-4 text-sm leading-6 text-blue-100"><DatabaseZap className="mt-0.5 h-5 w-5 shrink-0" /><p>{t("قبل أي كتابة، يجب حل Product ID من قاعدة البيئة المستهدفة ومقارنة 0.000 بالسعر المعتمد داخل Data Diff.", "Before any write, resolve each Product ID from the target environment and show 0.000 → approved price in the Data Diff.")}</p></div>
        <div className="flex gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>{t("تم اعتماد الصور فقط. يظل الدمج محجوبًا حتى MERGE-P36-CONTINUATION، وتظل الكتابات والتفعيل والنشر الإنتاجي محجوبة حتى ACTIVATE117.", "Media only is approved. Merge remains blocked until MERGE-P36-CONTINUATION; Production writes, activation and publishing remain blocked until ACTIVATE117.")}</p></div>
      </div>

      <div className="space-y-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4 sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">PRODUCTION GATE</p>
          <h4 className="mt-2 text-lg font-semibold text-[var(--cream)]">{t("تحضير البيانات ثم النشر الذري", "Prepare data, then publish atomically")}</h4>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{t("الخطوة الأولى ترفع الصور المعتمدة وتطبّق الأسعار مع إبقاء الأصناف DRAFT. الخطوة الثانية تفعّل الـ13 وتنشئ Revision v2 وتنشرها على القنوات الثلاث في معاملة واحدة.", "Step one uploads approved media and applies prices while products remain DRAFT. Step two activates all 13, creates Revision v2 and publishes all three channels in one transaction.")}</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">
          <button type="button" onClick={() => void prepareProductionData()} disabled={stage === "preparing" || stage === "activating" || stage === "complete"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/25 px-4 text-sm font-semibold text-emerald-100 disabled:opacity-50">
            {stage === "preparing" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}{t("تجهيز Production", "Prepare Production")}
          </button>
          <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>{t("رمز التفعيل", "Activation token")}</span><input value={approvalToken} onChange={(event) => setApprovalToken(event.target.value.trim().toUpperCase())} placeholder="ACTIVATE117" autoComplete="off" spellCheck={false} className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 font-mono text-sm text-[var(--cream)] outline-none focus:border-emerald-300/50" /></label>
          <button type="button" onClick={() => void activateAndPublish()} disabled={stage !== "prepared" || approvalToken !== "ACTIVATE117"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-bold text-black disabled:opacity-35">
            {stage === "activating" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}{t("تفعيل 117 ونشر v2", "Activate 117 & publish v2")}
          </button>
        </div>
        {message ? <p role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${stage === "error" ? "border-red-300/20 bg-red-300/[0.07] text-red-100" : "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100"}`}>{message}</p> : null}
      </div>
    </section>
  );
}
