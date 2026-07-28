import { Coffee } from "lucide-react";

export default function MenuLoading() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#f5efe3]" aria-busy="true" aria-label="Loading SALORA menu">
      <header className="h-16 border-b border-white/10 bg-black/85 sm:h-[4.5rem]" />
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-12 max-w-xl animate-pulse rounded-2xl bg-white/10" />
        <div className="mt-3 h-5 max-w-2xl animate-pulse rounded-full bg-white/[0.07]" />
        <div className="mt-8 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-11 w-28 shrink-0 animate-pulse rounded-full bg-white/[0.07]" />)}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
              <div className="grid aspect-[16/10] place-items-center bg-white/[0.04]"><Coffee className="h-12 w-12 text-white/10" /></div>
              <div className="space-y-3 p-5"><div className="h-6 w-2/3 animate-pulse rounded bg-white/10" /><div className="h-4 w-full animate-pulse rounded bg-white/[0.07]" /><div className="h-12 animate-pulse rounded-xl bg-white/10" /></div>
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Loading menu…</span>
    </main>
  );
}
