"use client";

import Image from "next/image";
import { CheckCircle2, DatabaseZap, ImageIcon, ShieldAlert } from "lucide-react";
import { p36ActivationCandidates, p36CandidateProductIds, p36MediaApproval, p36MediaSpecification, p36PriceApproval } from "@/lib/control-tower/p36ActivationManifest";
import { useControlTowerLocale } from "./ControlTowerLocale";

export function P36ActivationReview() {
  const { isArabic } = useControlTowerLocale();
  const t = (ar: string, en: string) => isArabic ? ar : en;

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
    </section>
  );
}
