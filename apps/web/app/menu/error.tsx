"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function MenuError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-4 text-[#f5efe3]">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl" role="alert">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-200"><AlertCircle className="h-6 w-6" /></span>
        <h1 className="mt-5 text-2xl font-semibold">تعذر تحميل المنيو</h1>
        <p className="mt-3 text-sm leading-7 text-[#9c9387]">تحقق من الاتصال ثم أعد المحاولة. لم يتم فقد أي طلب أو تعديل أي بيانات.</p>
        <button type="button" onClick={reset} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c9a45c] px-5 font-semibold text-black">
          <RefreshCw className="h-4 w-4" /> إعادة المحاولة
        </button>
      </section>
    </main>
  );
}
