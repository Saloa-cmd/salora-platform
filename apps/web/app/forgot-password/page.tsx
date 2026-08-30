"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { ThemeControl } from "@/components/ui/ThemeControl";

export default function ForgotPasswordPage() {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const ar = locale === "ar";
  const copy = (arabic: string, english: string) => ar ? arabic : english;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/password-reset/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email") }) });
      if (!response.ok) { setError(copy("خدمة الاستعادة غير متاحة مؤقتًا.", "Password reset is temporarily unavailable.")); return; }
      setSent(true);
    } catch { setError(copy("تعذر الاتصال بخدمة الاستعادة.", "Could not reach the password reset service.")); }
    finally { setLoading(false); }
  }

  return <main dir={ar ? "rtl" : "ltr"} lang={locale} className="min-h-screen bg-[var(--background)] px-5 py-6 text-[var(--cream)]">
    <div className="mx-auto flex max-w-xl items-center justify-between"><div><p className="font-semibold tracking-[0.22em] text-[var(--gold-soft)]">SALORA</p><p className="mt-1 text-xs text-[var(--muted)]">Password Recovery</p></div><div className="flex gap-2"><ThemeControl locale={locale} /><button type="button" onClick={() => setLocale(ar ? "en" : "ar")} className="min-h-11 rounded-xl border border-[var(--border-subtle)] px-3 text-xs font-semibold">{ar ? "EN" : "ع"}</button></div></div>
    <section className="mx-auto mt-12 max-w-xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-2xl sm:p-10">
      <KeyRound className="h-7 w-7 text-[var(--gold-soft)]" aria-hidden="true" /><h1 className="mt-6 text-3xl font-semibold">{copy("استعادة كلمة المرور", "Reset your password")}</h1><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{copy("أدخل بريد حسابك وسنرسل رابطًا آمنًا صالحًا لمدة 15 دقيقة.", "Enter your account email and we will send a secure link valid for 15 minutes.")}</p>
      {sent ? <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-5" role="status"><div className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><p>{copy("إذا كان البريد مرتبطًا بحساب نشط، فستصل رسالة الاستعادة قريبًا.", "If the email belongs to an active account, a reset message will arrive shortly.")}</p></div></div> : <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={loading}>{error ? <p className="rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3 text-sm text-red-100" role="alert">{error}</p> : null}<div><label htmlFor="reset-email" className="mb-2 block text-sm font-semibold">{copy("البريد الإلكتروني", "Email address")}</label><input id="reset-email" name="email" type="email" autoComplete="email" required disabled={loading} className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 outline-none focus:border-[var(--border-gold)]" /></div><button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-[var(--cream)] px-5 text-sm font-semibold text-[var(--background)] disabled:opacity-50">{loading ? copy("جارٍ الإرسال…", "Sending…") : copy("إرسال رابط الاستعادة", "Send reset link")}</button></form>}
      <Link href="/login" className="mt-6 inline-flex min-h-11 items-center text-sm text-[var(--gold-soft)] underline-offset-4 hover:underline">{copy("العودة إلى تسجيل الدخول", "Back to sign in")}</Link>
    </section>
  </main>;
}
