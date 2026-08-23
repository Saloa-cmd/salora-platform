"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="m-0 bg-[#050505] text-[#f5efe3]">
        <main className="grid min-h-screen place-items-center px-5 py-12">
          <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl sm:p-10" role="alert">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><AlertTriangle className="h-6 w-6" aria-hidden="true" /></span>
            <p className="mt-5 text-xs font-semibold tracking-[0.24em] text-[#c9a45c]">SALORA · SAFE MODE</p>
            <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">تعذر إكمال هذه اللحظة</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#9c9387]">حافظنا على بياناتك ولم ننفّذ أي طلب. يمكنك إعادة المحاولة أو العودة إلى الواجهة الرئيسية.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c9a45c] px-5 font-semibold text-black"><RotateCcw className="h-4 w-4" aria-hidden="true" />إعادة المحاولة</button>
              <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 font-semibold"><Home className="h-4 w-4" aria-hidden="true" />الصفحة الرئيسية</Link>
            </div>
            {error.digest ? <p className="mt-6 text-[0.65rem] tracking-[0.12em] text-white/30">REFERENCE · {error.digest}</p> : null}
          </section>
        </main>
      </body>
    </html>
  );
}
