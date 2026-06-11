import type { ReactNode } from "react";

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function DashboardSection({ title, description, children }: DashboardSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>
      <div className="flex flex-col gap-1">
        <h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-title`} className="text-lg font-semibold text-[var(--cream)]">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
