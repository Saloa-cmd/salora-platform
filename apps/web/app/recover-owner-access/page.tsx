"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { ThemeControl } from "@/components/ui/ThemeControl";

export default function RecoverOwnerAccessPage() {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const isArabic = locale === "ar";
  const copy = (ar: string, en: string) => isArabic ? ar : en;

  useEffect(() => {
    fetch("/api/auth/owner-recovery", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setAvailable(payload.available === true))
      .catch(() => setAvailable(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== String(form.get("confirmPassword") || "")) {
      setError(copy("كلمتا المرور غير متطابقتين.", "Passwords do not match."));
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/owner-recovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), name: form.get("name"), recoveryToken: form.get("recoveryToken"), password })
      });
      if (!response.ok) {
        setError(copy("تعذر إكمال الاستعادة. تحقق من الرمز والمتطلبات أو أن العملية لم تُستخدم سابقًا.", "Recovery could not be completed. Verify the token and requirements, or confirm it was not already used."));
        return;
      }
      setComplete(true);
      setAvailable(false);
      event.currentTarget.reset();
    } catch {
      setError(copy("تعذر الاتصال بمسار الاستعادة الآمن.", "The secure recovery service could not be reached."));
    } finally {
      setLoading(false);
    }
  }

  return <main dir={isArabic ? "rtl" : "ltr"} lang={locale} className="min-h-screen bg-[var(--background)] px-5 py-6 text-[var(--cream)] sm:px-8">
    <div className="mx-auto flex max-w-2xl items-center justify-between"><div><p className="font-semibold tracking-[0.22em] text-[var(--gold-soft)]">SALORA</p><p className="mt-1 text-xs text-[var(--muted)]">Owner Recovery</p></div><div className="flex gap-2"><ThemeControl locale={locale} /><button type="button" onClick={() => setLocale(isArabic ? "en" : "ar")} className="min-h-11 rounded-xl border border-[var(--border-subtle)] px-3 text-xs font-semibold">{isArabic ? "EN" : "ع"}</button></div></div>
    <section className="mx-auto mt-12 max-w-2xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-2xl sm:p-10">
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--border-gold)] text-[var(--gold-soft)]"><KeyRound className="h-5 w-5" aria-hidden="true" /></span>
      <h1 className="mt-6 text-3xl font-semibold">{copy("استعادة وصول المالك", "Restore owner access")}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{copy("مسار أحادي الاستخدام لإنشاء حساب المالك الإداري عندما لا يوجد Admin معتمد. لا تُرسل كلمة المرور أو رمز الاستعادة عبر المحادثات.", "A one-time path to create the owner administrator when no approved Admin exists. Never send the password or recovery token through chat.")}</p>

      {complete ? <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-5" role="status"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><strong>{copy("تم إنشاء حساب Admin وإغلاق مسار الاستعادة.", "The Admin account was created and recovery is now closed.")}</strong></div><Link href="/login?next=/control-tower/overview" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--cream)] px-5 text-sm font-semibold text-[var(--background)]">{copy("الانتقال إلى تسجيل الدخول", "Continue to sign in")}</Link></div> : null}
      {!complete && available === false ? <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 text-sm text-amber-100" role="status">{copy("مسار الاستعادة غير مفعّل أو استُخدم سابقًا.", "Recovery is not enabled or has already been used.")}</div> : null}
      {!complete && available !== false ? <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={loading}>
        {error ? <div className="flex gap-3 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><p className="text-sm text-red-100">{error}</p></div> : null}
        <div><label htmlFor="owner-email" className="mb-2 block text-sm font-semibold">{copy("البريد الإداري", "Admin email")}</label><input id="owner-email" name="email" type="email" autoComplete="username" required disabled={loading || available === null} placeholder="admin@salora.cafe" className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 outline-none focus:border-[var(--border-gold)]" /></div>
        <div><label htmlFor="owner-name" className="mb-2 block text-sm font-semibold">{copy("اسم المالك", "Owner name")}</label><input id="owner-name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={120} disabled={loading || available === null} className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 outline-none focus:border-[var(--border-gold)]" /></div>
        <div><label htmlFor="recovery-token" className="mb-2 block text-sm font-semibold">{copy("رمز الاستعادة", "Recovery token")}</label><input id="recovery-token" name="recoveryToken" type="password" autoComplete="one-time-code" required minLength={32} disabled={loading || available === null} className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 outline-none focus:border-[var(--border-gold)]" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold">{copy("كلمة المرور الجديدة", "New password")}</label><input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={16} disabled={loading || available === null} className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 outline-none focus:border-[var(--border-gold)]" /></div><div><label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">{copy("تأكيد كلمة المرور", "Confirm password")}</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={16} disabled={loading || available === null} className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-4 outline-none focus:border-[var(--border-gold)]" /></div></div>
        <p className="text-xs leading-6 text-[var(--muted)]">{copy("16 حرفًا على الأقل، مع حرف كبير وصغير ورقم ورمز. تُحفظ بصيغة Argon2 ولا تُسجّل في Audit Log.", "Use at least 16 characters with uppercase, lowercase, number, and symbol. It is stored with Argon2 and never written to the Audit Log.")}</p>
        <button type="submit" disabled={loading || available !== true} className="min-h-12 w-full rounded-xl bg-[var(--cream)] px-5 text-sm font-semibold text-[var(--background)] disabled:opacity-50">{loading ? copy("جارٍ الاستعادة…", "Restoring…") : copy("إنشاء Admin وإغلاق الاستعادة", "Create Admin and close recovery")}</button>
      </form> : null}
    </section>
  </main>;
}
