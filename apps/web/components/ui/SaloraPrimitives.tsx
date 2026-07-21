import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "gold" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/[0.05] text-[var(--cream)] hover:bg-white/10",
  gold: "border-[var(--border-gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)] hover:bg-[var(--gold)]/20",
  success: "border-emerald-300/15 bg-emerald-300/10 text-emerald-200",
  danger: "border-red-300/15 bg-red-300/5 text-red-100 hover:bg-red-300/10"
};

export function SaloraButton({ className = "", tone = "neutral", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none disabled:opacity-50 ${toneClasses[tone]} ${className}`} {...props}>{children}</button>;
}

export function SaloraBadge({ className = "", tone = "neutral", children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`} {...props}>{children}</span>;
}

export function SaloraSurface({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.04] ${className}`} {...props}>{children}</div>;
}

export function SaloraEmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <SaloraSurface className="grid place-items-center px-6 py-12 text-center"><div className="max-w-md">{icon ? <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border-gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]">{icon}</div> : null}<h3 className="text-lg font-semibold text-[var(--cream)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>{action ? <div className="mt-5 flex justify-center">{action}</div> : null}</div></SaloraSurface>;
}
