"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { ControlTowerSectionId } from "@/lib/control-tower/types";
import { controlTowerPost } from "@/lib/control-tower/client";
import { SaloraIcon } from "@/components/ui/SaloraIcon";
import { useControlTowerLocale } from "./ControlTowerLocale";

type CopilotResponse = {
  answer: string;
  provider: { provider: string; model: string };
  usage: { inputTokens: number; outputTokens: number; estimatedCost: number };
  safety: { blocked: boolean; reasons: string[] };
  evaluation: { score: number; notes: string[] };
  correlationId: string;
  observedAt: string;
};

const suggestions: Record<ControlTowerSectionId, { ar: string[]; en: string[] }> = {
  overview: {
    ar: ["ما أهم شيء يحتاج انتباهي الآن؟", "حلل صحة التشغيل الحالية", "ما أفضل ثلاث أولويات اليوم؟"],
    en: ["What needs my attention now?", "Analyze current operating health", "What are today's top three priorities?"]
  },
  experience: {
    ar: ["ما الذي ينقص تجربة SALORA الحالية؟", "اقترح تحسينات آمنة للواجهة", "ما الذي يجب مراجعته قبل النشر؟"],
    en: ["What is missing from the SALORA experience?", "Suggest safe interface improvements", "What should be reviewed before publishing?"]
  },
  menu: {
    ar: ["حلل جاهزية المنيو والصور", "أين توجد فجوات محتوى واضحة؟", "ما أولوية تحسين الأصناف؟"],
    en: ["Analyze menu and media readiness", "Where are the clearest content gaps?", "What product improvements should come first?"]
  },
  orders: {
    ar: ["حلل وضع الطلبات الحالية", "هل توجد إشارات تشغيلية تستحق المتابعة؟", "ما الخطوة التالية الآمنة للطلبات؟"],
    en: ["Analyze the current order state", "Are there operational signals to follow up?", "What is the next safe order action?"]
  },
  customers: {
    ar: ["ما الذي يمكن تحسينه دون كشف بيانات العملاء؟", "حلل جاهزية تجربة الولاء", "اقترح خطوات لتحسين الاحتفاظ بالعملاء"],
    en: ["What can improve without exposing customer data?", "Analyze loyalty experience readiness", "Suggest retention improvements"]
  },
  marketing: {
    ar: ["اقترح أولويات تسويقية بناءً على البيانات الحالية", "ما المحتوى الذي يحتاج دعمًا؟", "ما فرصة النمو الأكثر أمانًا؟"],
    en: ["Suggest marketing priorities from current data", "What content needs support?", "What is the safest growth opportunity?"]
  },
  ai: {
    ar: ["قيّم جاهزية الذكاء الاصطناعي في SALORA", "كيف نوسع AI بأمان؟", "ما الذي يحتاج مراقبة في AI؟"],
    en: ["Assess SALORA AI readiness", "How can we expand AI safely?", "What AI signals need monitoring?"]
  },
  analytics: {
    ar: ["لخص أهم المؤشرات المرصودة", "ما البيانات التي يجب أن تصبح KPI؟", "ما الفجوات التحليلية الحالية؟"],
    en: ["Summarize the most important observed indicators", "Which data should become KPIs?", "What analytics gaps remain?"]
  },
  operations: {
    ar: ["ما مخاطر التشغيل الحالية؟", "رتب أولويات الجاهزية التقنية", "ما الذي يجب مراقبته قبل التوسع؟"],
    en: ["What are the current operational risks?", "Prioritize technical readiness", "What should be monitored before scaling?"]
  },
  settings: {
    ar: ["راجع جاهزية الإعدادات والحوكمة", "ما الذي يجب ضبطه دون كشف أسرار؟", "اقترح تحسينات للحوكمة"],
    en: ["Review configuration and governance readiness", "What should be configured without exposing secrets?", "Suggest governance improvements"]
  }
};

export function ControlTowerCopilot({ sectionId }: { sectionId: ControlTowerSectionId }) {
  const { isArabic } = useControlTowerLocale();
  const copy = (ar: string, en: string) => isArabic ? ar : en;
  const prompts = useMemo(() => suggestions[sectionId][isArabic ? "ar" : "en"], [isArabic, sectionId]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<CopilotResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(value = question) {
    const normalized = value.trim();
    if (normalized.length < 2 || loading) return;
    setLoading(true);
    setMessage(null);
    const result = await controlTowerPost<CopilotResponse>("/api/control-tower/copilot", {
      section: sectionId,
      question: normalized,
      locale: isArabic ? "ar" : "en"
    });
    if (result.status === "success" && result.data) {
      setAnswer(result.data);
      setQuestion(normalized);
    } else {
      setAnswer(null);
      setMessage(result.message ?? copy("تعذر تشغيل مساعد SALORA الآن.", "SALORA Copilot could not run right now."));
    }
    setLoading(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask();
  }

  return <section className="overflow-hidden rounded-2xl border border-[var(--border-gold)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface)_92%,var(--gold)_8%),var(--surface))]" aria-labelledby="salora-copilot-title">
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(19rem,.9fr)] lg:p-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"><SaloraIcon name="ai" className="h-5 w-5" /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-soft)]">SALORA AI · COPILOT</p>
            <h2 id="salora-copilot-title" className="mt-1 text-lg font-semibold">{copy("مساعد سياقي لهذا القسم", "Contextual assistant for this workspace")}</h2>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-6 text-[var(--muted)]">{copy("يحلل البيانات المجمعة المصرح بها فقط. لا ينشر، لا يعدل، لا يحذف، ولا يرى الأسرار أو بيانات العملاء الخام.", "It analyzes only permission-scoped aggregate data. It cannot publish, mutate, delete, or access secrets or raw customer data.")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => { setQuestion(prompt); void ask(prompt); }} disabled={loading} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-start text-[11px] leading-4 text-[var(--muted)] transition hover:border-[var(--border-gold)] hover:text-[var(--cream)] disabled:opacity-50">{prompt}</button>)}
        </div>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-white/[0.08] bg-black/15 p-4">
        <label htmlFor={`salora-copilot-question-${sectionId}`} className="text-xs font-semibold text-[var(--cream)]">{copy("اسأل عن هذا القسم", "Ask about this workspace")}</label>
        <textarea
          id={`salora-copilot-question-${sectionId}`}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          maxLength={1200}
          placeholder={copy("مثال: ما أهم شيء يحتاج انتباهي الآن؟", "Example: What needs my attention right now?")}
          className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-[var(--cream)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-gold)]"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[10px] text-[var(--muted)]">{question.length}/1200</span>
          <button type="submit" disabled={loading || question.trim().length < 2} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--gold)] px-4 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            <SaloraIcon name="ai" className="h-4 w-4" />
            {loading ? copy("جارٍ التحليل…", "Analyzing…") : copy("تحليل", "Analyze")}
          </button>
        </div>
      </form>
    </div>

    <div className="border-t border-white/[0.08] bg-black/10 px-5 py-5 lg:px-6" aria-live="polite">
      {message ? <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-xs leading-5 text-amber-100">{message}</p> : null}
      {!message && !answer ? <div className="flex items-center gap-2 text-xs text-[var(--muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /><span>{copy("جاهز لتحليل البيانات المرصودة لهذا القسم عند الطلب.", "Ready to analyze observed workspace data on demand.")}</span></div> : null}
      {answer ? <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-[var(--muted)]">
          <span className="font-semibold text-[var(--gold-soft)]">{answer.provider.provider} · {answer.provider.model}</span>
          <span>{copy("تقييم", "Evaluation")} {Math.round(answer.evaluation.score * 100) / 100}</span>
          <span>{copy("المرجع", "Trace")} {answer.correlationId.slice(0, 8)}</span>
          {answer.safety.blocked ? <span className="text-amber-200">{copy("تم تطبيق حظر أمان", "Safety block applied")}</span> : null}
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--cream)]">{answer.answer}</p>
        <p className="mt-4 text-[10px] text-[var(--muted)]">{copy("اقتراح تحليلي للمراجعة البشرية — لم يتم تنفيذ أي تغيير تشغيلي.", "Analytical suggestion for human review — no operational change was executed.")}</p>
      </div> : null}
    </div>
  </section>;
}
