"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function MenuError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-5 py-12 text-[var(--foreground)]">
      <section className="w-full max-w-lg rounded-[var(--radius-modal)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-raised)]" role="alert">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-200"><AlertCircle className="h-6 w-6" /></span>
        <h1 className="mt-5 text-2xl font-semibold">تعذر تحميل المنيو</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">تحقق من الاتصال ثم أعد المحاولة. لم يتم فقد أي طلب أو تعديل أي بيانات.</p>
        <p className="mt-2 text-xs leading-6 text-[var(--foreground-muted)]" lang="en" dir="ltr">The menu could not load. No order or data change was made.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand)] px-5 font-semibold text-[var(--brand-foreground)]"><RefreshCw className="h-4 w-4" /> إعادة المحاولة</button>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-strong)] px-5 font-semibold">الصفحة الرئيسية</Link>
        </div>
      </section>
    </main>
  );
}
