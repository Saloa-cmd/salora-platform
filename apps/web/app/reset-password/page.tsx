"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { ThemeControl } from "@/components/ui/ThemeControl";

export default function ResetPasswordPage() {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const ar = locale === "ar";
  const copy = (arabic: string, english: string) => ar ? arabic : english;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    const form = new FormData(event.currentTarget); const password = String(form.get("password") || "");
    if (!token) { setError(copy("رابط الاستعادة غير مكتمل.", "The reset link is incomplete.")); setLoading(false); return; }
    if (password !== String(form.get("confirm") || "")) { setError(copy("كلمتا المرور غير متطابقتين.", "Passwords do not match.")); setLoading(false); return; }
    try {
      const response = await fetch("/api/auth/password-reset/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) });
      if (!response.ok) { setError(copy("الرابط غير صالح أو منتهي، أو كلمة المرور لا تستوفي المتطلبات.", "The link is invalid or expired, or the password does not meet requirements.")); return; }
      setComplete(true);
    } catch { setError(copy("تعذر إكمال الاستعادة.", "Could not complete password reset.")); }
    finally { setLoading(false); }
  }

  return <main dir={ar ? "rtl" : "ltr"} lang={locale} className="min-h-screen bg-[var(--background)] px-5 py-6 text-[var(--cream)]">
    <div className="mx-auto flex max-w-xl items-center justify-between"><p className="font-semibold tracking-[0.22em] text-[var(--gold-soft)]">SALORA</p><div className="flex gap-2"><ThemeControl locale={locale} /><button type="button" onClick={() => setLocale(ar ? "en" : "ar")} className="min-h-11 rounded-xl border border-[var(--border-subtle)] px-3 text-xs font-semibold">{ar ? "EN" : "ع"}</button></div></div>
    <section className="mx-auto mt-12 max-w-xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-2xl sm:p-10"><ShieldCheck className="h-7 w-7 text-[var(--gold-soft)]" /><h1 className="mt-6 text-3xl font-semibold">{copy("تعيين كلمة مرور جديدة", "Set a new password")}</h1>
      {complete ? <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-5" role="status"><div className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><p>{copy("تم تغيير كلمة المرور وإلغاء جميع جلسات التجديد القديمة. تنتهي رموز الوصول القديمة تلقائيًا خلال مدة قصيرة.", "Your password was changed and all previous refresh sessions were revoked. Existing short-lived access tokens expire automatically.")}</p></div><Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--cream)] px-5 text-sm font-semibold text-[var(--background)]">{copy("تسجيل الدخول", "Sign in")}</Link></div> : <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={loading}>{error ? <p className="rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3 text-sm text-red-100" role="alert">{error}</p> : null}<div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold">{copy("كلمة المرور الجديدة", "New password")}</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={16} required disabled={loading} className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 outline-none focus:border-[var(--border-gold)]" /></div><div><label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">{copy("تأكيد كلمة المرور", "Confirm password")}</label><input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={16} required disabled={loading} className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 outline-none focus:border-[var(--border-gold)]" /></div><p className="text-xs leading-6 text-[var(--muted)]">{copy("16 حرفًا على الأقل مع حرف كبير وصغير ورقم ورمز.", "Use at least 16 characters with uppercase, lowercase, number and symbol.")}</p><button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-[var(--cream)] px-5 text-sm font-semibold text-[var(--background)] disabled:opacity-50">{loading ? copy("جارٍ الحفظ…", "Saving…") : copy("تغيير كلمة المرور", "Change password")}</button></form>}
    </section>
  </main>;
}
