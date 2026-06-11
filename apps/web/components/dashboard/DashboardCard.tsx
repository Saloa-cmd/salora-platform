import type { ReactNode } from "react";

type DashboardCardProps = {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DashboardCard({ title, eyebrow, action, children, className = "" }: DashboardCardProps) {
  return (
    <article className={`rounded-xl border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}>
      {(title || eyebrow || action) ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--gold-soft)]">{eyebrow}</p> : null}
            {title ? <h2 className="mt-1 text-base font-semibold text-[var(--cream)]">{title}</h2> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </article>
  );
}
