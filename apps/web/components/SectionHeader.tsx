interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  copy?: string;
}

export function SectionHeader({ eyebrow, title, copy }: SectionHeaderProps) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="text-xs uppercase tracking-[0.32em] text-goldSoft">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-cream md:text-5xl">{title}</h2>
      {copy ? <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted">{copy}</p> : null}
    </div>
  );
}
