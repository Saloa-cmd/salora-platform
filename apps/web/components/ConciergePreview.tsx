"use client";

import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type Language = "ar" | "en";
type ConciergeResponse = {
  answer: string;
  provider: { provider: string; model: string };
  safety: { blocked: boolean; reasons: string[] };
  evaluation: { score: number; notes: string[] };
  correlationId: string;
};
type ApiEnvelope = { requestId?: string; data?: ConciergeResponse; error?: string };

const copy = {
  ar: {
    prompts: ["أريد شيئًا باردًا وغير حلو كثيرًا", "اقترح لي قهوة مع حلى", "أريد ماتشا", "ماذا أطلب لمساء هادئ؟"],
    intro: "قل لي مزاجك أو النكهة التي تفضلها، وسأستخدم منيو سالورا المنشور لمساعدتك في الاختيار.",
    grounded: "يعتمد على منيو سالورا المنشور",
    live: "ذكاء مباشر",
    provider: "المزوّد",
    unavailable: "مساعد سالورا غير متاح مؤقتًا. يمكنك متابعة تصفح المنيو والمحاولة لاحقًا.",
    safety: "تم التعامل مع هذا الطلب بقيود أمان إضافية.",
    offline: "تعذر اتصال مساعد سالورا بالذكاء الاصطناعي بأمان. يبقى المنيو متاحًا أثناء توقف الخدمة.",
    composing: "مساعد سالورا يجهز الاقتراح",
    ask: "اسأل مساعد سالورا",
    placeholder: "صف مزاجك أو ما ترغب به",
    send: "إرسال إلى مساعد سالورا",
    advisory: "اقتراحات الذكاء الاصطناعي إرشادية؛ التوفر والأسعار والمنيو المنشور هي المرجع المعتمد."
  },
  en: {
    prompts: ["I want something cold and not too sweet", "Recommend a coffee with dessert", "Matcha please", "What should I order for a calm evening?"],
    intro: "Tell me your mood, taste, or what you are pairing it with — I’ll use SALORA’s published menu to help you choose.",
    grounded: "Grounded in SALORA’s published Menu Authority",
    live: "Live AI",
    provider: "AI provider",
    unavailable: "SALORA Concierge is temporarily unavailable. You can keep browsing the menu and try again later.",
    safety: "This request was handled with an additional safety restriction.",
    offline: "SALORA Concierge could not connect safely. Your menu remains available while AI is offline.",
    composing: "SALORA Concierge is composing a recommendation",
    ask: "Ask SALORA Concierge",
    placeholder: "Tell us your mood",
    send: "Send to SALORA Concierge",
    advisory: "AI suggestions are advisory. Availability, price, and published menu data remain authoritative."
  }
} as const;

export function ConciergePreview({ language = "ar" }: { language?: Language }) {
  const t = copy[language];
  const [input, setInput] = useState<string>(t.prompts[0]);
  const [answer, setAnswer] = useState<string>(t.intro);
  const [provider, setProvider] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(t.prompts[0]);
    setAnswer(t.intro);
    setProvider(null);
    setMessage(null);
  }, [language, t.intro, t.prompts]);

  const canSubmit = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function ask(value = input) {
    const normalized = value.trim();
    if (!normalized || loading) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/ai/concierge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: normalized, channel: "web", locale: language })
      });
      const payload = await response.json().catch(() => null) as ApiEnvelope | null;
      if (!response.ok || !payload?.data) {
        setMessage(payload?.error ?? t.unavailable);
        return;
      }
      setAnswer(payload.data.answer);
      setProvider(`${payload.data.provider.provider} · ${payload.data.provider.model}`);
      if (payload.data.safety.blocked) setMessage(t.safety);
    } catch {
      setMessage(t.offline);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask();
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4 shadow-glow backdrop-blur" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="grid size-10 place-items-center rounded-full bg-gold/15 text-goldSoft"><Bot size={18} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-cream">SALORA Concierge</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-200"><Sparkles size={11} aria-hidden="true" />{t.live}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{t.grounded}</p>
        </div>
      </div>

      <div className="space-y-4 py-5" aria-live="polite">
        <div className="ms-auto max-w-[82%] rounded-lg bg-gold/15 px-4 py-3 text-sm text-cream">{input}</div>
        <div className="max-w-[92%] rounded-lg bg-white/[0.06] px-4 py-3 text-sm leading-6 text-muted">
          {loading ? <div aria-label={t.composing}><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div> : answer}
        </div>
        {provider && !loading ? <p className="text-[10px] text-muted">{t.provider}: {provider}</p> : null}
        {message ? <p className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs leading-5 text-amber-100">{message}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2 pb-4">
        {t.prompts.map((prompt) => <button key={prompt} type="button" disabled={loading} className="rounded-full border border-white/10 px-3 py-2 text-xs text-muted transition hover:border-gold/30 hover:text-cream disabled:cursor-not-allowed disabled:opacity-50" onClick={() => { setInput(prompt); void ask(prompt); }}>{prompt}</button>)}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 focus-within:border-gold/30">
        <label htmlFor="salora-concierge-question" className="sr-only">{t.ask}</label>
        <input id="salora-concierge-question" value={input} onChange={(event) => setInput(event.target.value)} maxLength={1000} className="min-w-0 flex-1 bg-transparent text-sm text-cream outline-none placeholder:text-muted" placeholder={t.placeholder} />
        <button type="submit" disabled={!canSubmit} aria-label={t.send} className="grid size-8 place-items-center rounded-full text-goldSoft transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button>
      </form>
      <p className="mt-3 text-[10px] leading-4 text-muted">{t.advisory}</p>
    </div>
  );
}
