import Image from "next/image";
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

function productName(product: Product, locale: "ar" | "en") {
  return locale === "ar" ? product.nameAr || product.name : product.nameEn || product.name;
}

function productCategory(product: Product, locale: "ar" | "en") {
  return locale === "ar" ? product.categoryAr || product.category : product.categoryEn || product.category;
}

function productImage(product: Product) {
  return /^https:\/\//i.test(product.visual) ? product.visual : undefined;
}

function productPrice(product: Product, locale: "ar" | "en") {
  if (product.price <= 0) return locale === "ar" ? "السعر قريبًا" : "Price coming soon";
  return locale === "ar" ? `${product.price.toFixed(3)} ر.ع` : `OMR ${product.price.toFixed(3)}`;
}

function ProductShowcaseCard({ product, locale }: { product: Product; locale: "ar" | "en" }) {
  const image = productImage(product);
  const name = productName(product, locale);
  return (
    <article className="salora-showcase-card group overflow-hidden">
      <div className="salora-showcase-media relative aspect-[4/5] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 92vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <div className="salora-showcase-fallback absolute inset-0 flex items-end p-6" aria-label={locale === "ar" ? "صورة المنتج قيد التجهيز" : "Product image in preparation"}>
            <span className="max-w-[12rem] text-lg font-semibold leading-snug text-white/90">{name}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-medium tracking-wide text-[var(--muted)]">{productCategory(product, locale)}</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold leading-snug text-[var(--cream)]">{name}</h3>
          <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-[var(--gold-soft)]">{productPrice(product, locale)}</p>
        </div>
      </div>
    </article>
  );
}

function renderSection(section: ExperienceSectionV2, locale: "ar" | "en", products: Product[]) {
  const common = "mx-auto w-full px-4 py-12 sm:px-6";
  switch (section.componentId) {
    case "hero.luxury.v1": return <section key={section.id} data-component={section.componentId} className={`${common} max-w-7xl`}><h1 className="salora-display">{text(section.content.title, locale)}</h1><p className="mt-4 max-w-2xl text-[var(--muted)]">{text(section.content.subtitle, locale)}</p><div className="mt-6 flex flex-wrap gap-3"><ActionLink action={section.content.primaryAction} locale={locale} className="premium-button premium-button-gold" />{section.content.secondaryAction ? <ActionLink action={section.content.secondaryAction} locale={locale} className="premium-button premium-button-ghost" /> : null}</div></section>;
    case "menu.product-grid.premium.v1": {
      const items = products.filter((product) => !section.content.categoryKey || product.sectionKey === section.content.categoryKey).filter((product) => !section.content.featuredOnly || product.featured).slice(0, section.content.maxItems);
      return <section key={section.id} data-component={section.componentId} className={`${common} max-w-7xl`}><div className="max-w-3xl"><h2 className="text-3xl font-semibold sm:text-4xl">{text(section.content.heading, locale)}</h2>{section.content.description ? <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">{text(section.content.description, locale)}</p> : null}</div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((product) => <ProductShowcaseCard key={product.id} product={product} locale={locale} />)}</div></section>;
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
