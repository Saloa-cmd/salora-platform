import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "small" | "medium" | "large";
type LegacyTone = "neutral" | "gold" | "success" | "danger";
type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand-hover)]",
  secondary: "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] hover:border-[var(--border-strong)]",
  outline: "border-[var(--border-strong)] bg-transparent text-[var(--foreground)] hover:bg-white/[0.06]",
  ghost: "border-transparent bg-transparent text-[var(--foreground)] hover:bg-white/[0.06]",
  destructive: "border-red-300/20 bg-red-300/10 text-red-100 hover:bg-red-300/15"
};
const buttonSizes: Record<ButtonSize, string> = { small: "min-h-10 px-3 text-xs", medium: "min-h-11 px-4 text-sm", large: "min-h-12 px-5 text-base" };
const legacyToneMap: Record<LegacyTone, ButtonVariant> = { neutral: "secondary", gold: "primary", success: "outline", danger: "destructive" };

export function SaloraButton({ className = "", variant, tone, size = "medium", loading = false, children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; tone?: LegacyTone; size?: ButtonSize; loading?: boolean }) {
  const resolvedVariant = variant ?? (tone ? legacyToneMap[tone] : "secondary");
  return <button className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border font-semibold transition-[background-color,border-color,color,opacity,transform] duration-[var(--duration-normal)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${buttonVariants[resolvedVariant]} ${buttonSizes[size]} ${className}`} aria-busy={loading || undefined} disabled={disabled || loading} {...props}>{loading ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none" /> : null}<span>{children}</span></button>;
}

export function SaloraIconButton({ label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={props.title ?? label} className={`inline-grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:border-[var(--border-strong)] disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

const statusClasses: Record<StatusTone, string> = {
  neutral: "border-[var(--border)] bg-white/[0.05] text-[var(--foreground)]", brand: "border-[var(--border-brand)] bg-[var(--brand)]/10 text-[var(--brand-hover)]",
  success: "border-emerald-300/15 bg-emerald-300/10 text-emerald-200", warning: "border-amber-300/15 bg-amber-300/10 text-amber-100",
  danger: "border-red-300/15 bg-red-300/10 text-red-100", info: "border-sky-300/15 bg-sky-300/10 text-sky-100"
};
export function SaloraBadge({ className = "", tone = "neutral", children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone | LegacyTone }) {
  const resolved: StatusTone = tone === "gold" ? "brand" : tone;
  return <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[resolved]} ${className}`} {...props}>{children}</span>;
}

export function SaloraSurface({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={`rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] ${className}`} {...props}>{children}</div>; }

export function SaloraField({ id, label, description, error, required, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; description?: string; error?: string }) {
  const descriptionId = description ? `${id}-description` : undefined; const errorId = error ? `${id}-error` : undefined;
  return <div className="grid gap-2"><label htmlFor={id} className="text-sm font-semibold text-[var(--foreground)]">{label}{required ? <span aria-hidden="true" className="ms-1 text-[var(--danger)]">*</span> : null}</label>{description ? <p id={descriptionId} className="text-xs text-[var(--foreground-muted)]">{description}</p> : null}<input id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined} className={`min-h-11 rounded-[var(--radius-control)] border bg-[var(--interactive)] px-3 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${error ? "border-[var(--danger)]" : "border-[var(--border)]"} ${className}`} {...props} />{error ? <p id={errorId} role="alert" className="text-xs text-[var(--danger)]">{error}</p> : null}</div>;
}

export function SaloraAlert({ title, children, tone = "info", className = "" }: { title: string; children?: ReactNode; tone?: Exclude<StatusTone, "brand">; className?: string }) { return <div role={tone === "danger" ? "alert" : "status"} className={`rounded-[var(--radius-card)] border p-4 ${statusClasses[tone]} ${className}`}><p className="font-semibold">{title}</p>{children ? <div className="mt-1 text-sm opacity-90">{children}</div> : null}</div>; }
export function SaloraSkeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) { return <div aria-hidden="true" className={`animate-pulse rounded-[var(--radius-control)] bg-white/[0.08] motion-reduce:animate-none ${className}`} {...props} />; }
export function SaloraEmptyState({ icon, title, description, action, secondaryAction }: { icon?: ReactNode; title: string; description: string; action?: ReactNode; secondaryAction?: ReactNode }) { return <SaloraSurface className="grid place-items-center px-6 py-12 text-center"><div className="max-w-md">{icon ? <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border-brand)] bg-[var(--brand)]/10 text-[var(--brand-hover)]">{icon}</div> : null}<h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{description}</p>{action || secondaryAction ? <div className="mt-5 flex flex-wrap justify-center gap-3">{action}{secondaryAction}</div> : null}</div></SaloraSurface>; }
export function SaloraTableRegion({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) { return <div role="region" aria-label={label} tabIndex={0} className={`max-w-full overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] focus-visible:outline-none ${className}`}>{children}</div>; }
