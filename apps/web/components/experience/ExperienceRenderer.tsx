import Link from "next/link";
import type { ExperiencePageV2, ExperienceSectionV2, Product } from "@salora/types";
import { sectionsForPlatform } from "@/lib/experience/compatibility";
import { getExperienceComponentDefinition } from "@/lib/experience/component-registry";

type RendererProps = { page: ExperiencePageV2; locale: "ar" | "en"; platform?: "web" | "mobile" | "digital-menu"; products?: Product[] };
const text = (value: { ar: string; en: string }, locale: "ar" | "en") => value[locale];

function ActionLink({ action, locale, className }: { action: { label: { ar: string; en: string }; destination: string; external?: boolean }; locale: "ar" | "en"; className?: string }) {
  if (action.external) return <a className={className} href={action.destination} target="_blank" rel="noreferrer">{text(action.label, locale)}</a>;
  return <Link className={className} href={action.destination}>{text(action.label, locale)}</Link>;
}

function renderSection(section: ExperienceSectionV2, locale: "ar" | "en", products: Product[]) {
  const common = "mx-auto w-full px-4 py-12 sm:px-6";
  switch (section.componentId) {
    case "hero.luxury.v1": return <section key={section.id} data-component={section.componentId} className={`${common} max-w-7xl`}><h1 className="salora-display">{text(section.content.title, locale)}</h1><p className="mt-4 max-w-2xl text-[var(--muted)]">{text(section.content.subtitle, locale)}</p><div className="mt-6 flex flex-wrap gap-3"><ActionLink action={section.content.primaryAction} locale={locale} className="premium-button premium-button-gold" />{section.content.secondaryAction ? <ActionLink action={section.content.secondaryAction} locale={locale} className="premium-button premium-button-ghost" /> : null}</div></section>;
    case "menu.product-grid.premium.v1": {
      const items = products.filter((product) => !section.content.categoryKey || product.sectionKey === section.content.categoryKey).filter((product) => !section.content.featuredOnly || product.featured).slice(0, section.content.maxItems);
      return <section key={section.id} data-component={section.componentId} className={`${common} max-w-7xl`}><h2 className="text-3xl font-semibold">{text(section.content.heading, locale)}</h2>{section.content.description ? <p className="mt-3 text-[var(--muted)]">{text(section.content.description, locale)}</p> : null}<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((product) => <article key={product.id} className="premium-menu-card p-5"><h3>{locale === "ar" ? product.nameAr || product.name : product.nameEn || product.name}</h3><p className="mt-2 text-[var(--gold-soft)]">{product.price.toFixed(3)} OMR</p></article>)}</div></section>;
    }
    case "story.editorial.v1": return <section key={section.id} data-component={section.componentId} className={`${common} max-w-4xl`}><h2 className="text-3xl font-semibold">{text(section.content.heading, locale)}</h2><p className="mt-4 leading-8 text-[var(--muted)]">{text(section.content.body, locale)}</p>{section.content.action ? <ActionLink action={section.content.action} locale={locale} className="premium-button premium-button-ghost mt-6" /> : null}</section>;
    case "location.map-card.v1": return <section key={section.id} data-component={section.componentId} className={`${common} max-w-7xl`}><h2 className="text-3xl font-semibold">{text(section.content.heading, locale)}</h2><p className="mt-3 text-[var(--muted)]">{text(section.content.address, locale)} · {text(section.content.hours, locale)}</p><ActionLink action={section.content.action} locale={locale} className="premium-button premium-button-gold mt-6" /></section>;
    case "cta.gold.v1": return <section key={section.id} data-component={section.componentId} className={`${common} max-w-5xl text-center`}><h2 className="text-3xl font-semibold">{text(section.content.heading, locale)}</h2>{section.content.body ? <p className="mt-3 text-[var(--muted)]">{text(section.content.body, locale)}</p> : null}<ActionLink action={section.content.action} locale={locale} className="premium-button premium-button-gold mt-6" /></section>;
  }
}

export function ExperienceRenderer({ page, locale, platform = "web", products = [] }: RendererProps) {
  const sections = sectionsForPlatform(page, platform);
  for (const section of sections) {
    if (!getExperienceComponentDefinition(section.componentId)) throw new Error(`Unsupported SALORA component: ${section.componentId}`);
  }
  return <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-experience-version={page.version} data-experience-status={page.status}>{sections.map((section) => renderSection(section, locale, products))}</main>;
}
