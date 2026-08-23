"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertTriangle, Menu, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-5 py-12 text-[var(--foreground)]">
      <section className="w-full max-w-xl rounded-[var(--radius-modal)] border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow-raised)] sm:p-10" role="alert">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><AlertTriangle className="h-6 w-6" aria-hidden="true" /></span>
        <p className="mt-5 text-xs font-semibold tracking-[0.24em] text-[var(--brand-hover)]">SALORA · SAFE MODE</p>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">تعذر تحميل التجربة</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--foreground-muted)]">لم يتم فقد أي طلب أو تعديل أي بيانات. أعد المحاولة، أو افتح المنيو الآمن للتحقق من حالة الخدمة.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand)] px-5 font-semibold text-[var(--brand-foreground)]"><RotateCcw className="h-4 w-4" aria-hidden="true" />إعادة المحاولة</button>
          <Link href="/menu" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-strong)] px-5 font-semibold"><Menu className="h-4 w-4" aria-hidden="true" />فتح المنيو</Link>
        </div>
      </section>
    </main>
  );
}
