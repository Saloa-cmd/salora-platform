"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { ThemeControl } from "@/components/ui/ThemeControl";
import { loginErrorMessage } from "@/lib/auth/loginError";

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const isArabic = locale === "ar";
  const copy = (ar: string, en: string) => isArabic ? ar : en;
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  useEffect(() => { emailInputRef.current?.focus(); }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!response.ok) {
        setError(loginErrorMessage(response.status, locale));
        return;
      }

      const requested = new URLSearchParams(window.location.search).get("next");
      const destination = requested?.startsWith("/control-tower") ? requested : "/control-tower/overview";
      router.replace(destination);
      router.refresh();
    } catch {
      setError(loginErrorMessage(0, locale));
    } finally {
      setLoading(false);
    }
  };

  return <main id="main-content" dir={isArabic ? "rtl" : "ltr"} lang={locale} className="relative grid min-h-screen bg-[var(--background)] text-[var(--cream)] lg:grid-cols-[minmax(20rem,.8fr)_minmax(28rem,1.2fr)]">
    <a href="#login-form" className="skip-link">{copy("انتقل إلى نموذج الدخول", "Skip to sign in")}</a>
    <aside className="relative hidden overflow-hidden border-e border-[var(--border-subtle)] bg-[var(--surface)] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14" aria-label={copy("تعريف منصة التحكم", "Control Tower introduction")}>
      <div><p className="text-lg font-semibold tracking-[0.24em] text-[var(--gold-soft)]">SALORA</p><p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Control Tower</p></div>
      <div className="max-w-md">
        <span className="mb-6 grid h-12 w-12 place-items-center rounded-xl border border-[var(--border-gold)] text-[var(--gold-soft)]"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></span>
        <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">{copy("كل ما تحتاجه لتشغيل سالورا، في مكان واحد.", "Everything you need to operate SALORA, in one place.")}</h2>
        <p className="mt-5 max-w-sm text-sm leading-7 text-[var(--muted)]">{copy("وصول آمن للفريق إلى التجربة والتجارة والنمو والتشغيل.", "Secure team access to experience, commerce, growth and operations.")}</p>
      </div>
      <p className="text-xs text-[var(--muted)]">{copy("الدخول مخصص لفريق سالورا المصرّح له.", "Access is restricted to authorized SALORA operators.")}</p>
    </aside>

    <section className="flex min-h-screen flex-col px-5 py-5 sm:px-8 lg:px-14 xl:px-24">
      <div className="flex items-center justify-between gap-3">
        <div className="lg:hidden"><p className="font-semibold tracking-[0.2em] text-[var(--gold-soft)]">SALORA</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Control Tower</p></div>
        <div className="ms-auto flex items-center gap-2"><ThemeControl locale={locale} /><button type="button" onClick={() => setLocale(isArabic ? "en" : "ar")} className="min-h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-xs font-semibold transition hover:border-[var(--border-gold)]" aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}>{isArabic ? "EN" : "ع"}</button></div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12"><div className="w-full">
        <p className="text-xs font-semibold text-[var(--gold-soft)]">{copy("وصول الفريق", "TEAM ACCESS")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy("تسجيل الدخول", "Sign in")}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{copy("أدخل بيانات حسابك للانتقال إلى النظرة العامة.", "Use your account to continue to the operational overview.")}</p>

        <form id="login-form" onSubmit={handleSubmit} className="mt-8 space-y-5" aria-busy={loading}>
          {error ? <div className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3" role="alert" aria-live="assertive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" /><p className="text-sm text-red-200">{error}</p></div> : null}
          <div><label htmlFor="email" className="mb-2 block text-sm font-semibold">{copy("البريد الإلكتروني", "Email address")}</label><input ref={emailInputRef} id="email" type="email" name="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} placeholder="name@salora.cafe" className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-gold)] disabled:opacity-50" /></div>
          <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">{copy("كلمة المرور", "Password")}</label><input id="password" type="password" name="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} placeholder="••••••••" className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-gold)] disabled:opacity-50" /></div>
          <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--cream)] px-4 text-sm font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"><span>{loading ? copy("جارٍ التحقق…", "Checking…") : copy("دخول آمن", "Secure sign in")}</span><Arrow className="h-4 w-4" aria-hidden="true" /></button>
        </form>
        <p className="mt-4 text-center text-xs"><Link href="/forgot-password" className="text-[var(--gold-soft)] underline-offset-4 hover:underline">{copy("نسيت كلمة المرور؟", "Forgot your password?")}</Link></p>
        <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">{copy("تُدار الجلسة عبر ملفات ارتباط آمنة ومقيّدة.", "Your session is handled with secure, restricted cookies.")}</p>
      </div></div>
    </section>
  </main>;
}
