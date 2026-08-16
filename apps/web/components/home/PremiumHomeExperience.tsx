"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpLeft, Instagram, Languages, MapPin, Menu, MessageCircle, ShoppingBag } from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { ExperienceConfiguration, MenuAuthoritySource, Product } from "@salora/types";

type Language = "ar" | "en";

const copy = {
  ar: {
    direction: "rtl" as const,
    nav: { story: "القصة", menu: "المنيو", visit: "الموقع" },
    harmony: "تجربة قهوة منسجمة",
    defaultTitle: "مذاقٌ يوقظ الحواس.",
    defaultIntro: "مشروبات مصممة بعناية، أجواء هادئة، وتفاصيل تحوّل كل زيارة إلى لحظة تستحق التذكّر.",
    explore: "اكتشف المنيو",
    location: "اعرف موقعنا",
    scroll: "مرّر للاكتشاف",
    selection: "مختاراتنا",
    menuTitle: "منيو تُروى تفاصيله",
    menuIntro: "نكهات مألوفة بلمسة سالورا الخاصة — طازجة، متوازنة ومُعدّة عند الطلب.",
    customize: "افتح وخصص",
    from: "يبدأ من",
    live: "متصل بمنيو سالورا",
    fallback: "يتم العرض مؤقتاً من القائمة المتوافقة",
    storyLabel: "روح المكان",
    storyTitle: "أكثر من قهوة.",
    storyBody: "سالورا مساحة للهدوء واللقاءات الجميلة. نصنع الضيافة بطريقتنا: جودة صادقة، تصميم دافئ، وخدمة تعرف أن التفاصيل الصغيرة تصنع الفرق.",
    visitLabel: "زوروا سالورا",
    visit: "واجهة شاطئ الدهاريز",
    city: "صلالة، سلطنة عُمان",
    hours: "يومياً · 4 مساءً — 2 صباحاً",
    directions: "الاتجاهات",
    whatsapp: "واتساب",
    footer: "تذوّق الانسجام"
  },
  en: {
    direction: "ltr" as const,
    nav: { story: "Story", menu: "Menu", visit: "Visit" },
    harmony: "Coffee in perfect harmony",
    defaultTitle: "A taste that awakens.",
    defaultIntro: "Thoughtful drinks, a quiet atmosphere, and details that turn every visit into a moment worth remembering.",
    explore: "Explore the menu",
    location: "Find SALORA",
    scroll: "Scroll to discover",
    selection: "Our selection",
    menuTitle: "A menu with a story",
    menuIntro: "Familiar flavours with the SALORA touch — fresh, balanced and made to order.",
    customize: "Open & customize",
    from: "From",
    live: "Connected to the SALORA menu",
    fallback: "Temporarily displaying the compatibility catalogue",
    storyLabel: "The spirit of SALORA",
    storyTitle: "Beyond coffee.",
    storyBody: "SALORA is a place for quiet moments and beautiful meetings. Honest quality, warm design, and hospitality shaped by the details that matter.",
    visitLabel: "Visit SALORA",
    visit: "Dahariz Beachfront",
    city: "Salalah, Sultanate of Oman",
    hours: "Daily · 4 PM — 2 AM",
    directions: "Directions",
    whatsapp: "WhatsApp",
    footer: "Taste the Harmony"
  }
};

function displayName(product: Product, language: Language) {
  return language === "ar" ? product.nameAr ?? product.name : product.nameEn ?? product.name;
}

function displayDescription(product: Product, language: Language) {
  return language === "ar"
    ? product.descriptionAr ?? product.description ?? product.story
    : product.descriptionEn ?? product.description ?? product.story;
}

function displayCategory(product: Product, language: Language) {
  return language === "ar" ? product.categoryAr ?? product.category : product.categoryEn ?? product.category;
}

function publicImage(product?: Product) {
  return product && /^https:\/\//i.test(product.visual) ? product.visual : undefined;
}

export function PremiumHomeExperience({
  featuredProducts,
  menuSource,
  menuStale,
  whatsappNumber,
  experience
}: {
  featuredProducts: Product[];
  menuSource: MenuAuthoritySource;
  menuStale: boolean;
  whatsappNumber: string;
  experience: ExperienceConfiguration;
}) {
  const [language, setLanguage] = useState<Language>("ar");
  const t = copy[language];
  const rtl = language === "ar";
  const heroProduct = featuredProducts[0];
  const heroImage = publicImage(heroProduct);
  const heroAlt = heroProduct ? displayName(heroProduct, language) : "SALORA";
  const normalizedNumber = whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = normalizedNumber ? `https://wa.me/${normalizedNumber}` : "/menu";
  const title = language === "ar"
    ? experience.site.heroTitleAr || t.defaultTitle
    : experience.site.heroTitleEn || t.defaultTitle;
  const intro = language === "ar"
    ? experience.site.heroSubtitleAr || t.defaultIntro
    : experience.site.heroSubtitleEn || t.defaultIntro;
  const themeStyle = {
    "--premium-gold": experience.theme.primaryColor,
    "--premium-cream": experience.theme.textColor,
    "--premium-muted": experience.theme.mutedColor,
    "--premium-background": experience.theme.backgroundColor
  } as CSSProperties;

  return (
    <main id="main-content" lang={language} dir={t.direction} className="premium-home" style={themeStyle}>
      <a href="#featured-menu" className="skip-link">{t.explore}</a>
      <header className="premium-header">
        <Link className="premium-brand" href="/" aria-label="SALORA home">
          <Image src="/brand/salora-logo-dark.jpeg" alt="" width={44} height={44} priority />
          <span>SALORA<small>TASTE THE HARMONY</small></span>
        </Link>
        <nav aria-label={rtl ? "التنقل الرئيسي" : "Main navigation"}>
          <a href="#story">{t.nav.story}</a>
          <Link href="/menu">{t.nav.menu}</Link>
          <a href="#visit">{t.nav.visit}</a>
        </nav>
        <div className="premium-header-actions">
          <button type="button" onClick={() => setLanguage(rtl ? "en" : "ar")} aria-label={rtl ? "Switch to English" : "التبديل إلى العربية"}>
            <Languages aria-hidden="true" /> <span>{rtl ? "EN" : "ع"}</span>
          </button>
          <Link href="/menu" aria-label={t.explore}><ShoppingBag aria-hidden="true" /></Link>
        </div>
      </header>

      {experience.site.showAnnouncement ? (
        <div className="premium-announcement">{rtl ? experience.site.announcementAr : experience.site.announcementEn}</div>
      ) : null}

      <section className="premium-hero">
        <div className="premium-hero-copy">
          <p className="premium-kicker"><span />{t.harmony}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
          <div className="premium-hero-actions">
            <Link className="premium-button premium-button-gold" href="/menu">{t.explore}<ArrowUpLeft aria-hidden="true" /></Link>
            <a className="premium-button premium-button-ghost" href="#visit">{t.location}</a>
          </div>
        </div>

        <div className="premium-hero-art" aria-label={heroAlt}>
          <div className="premium-orbit premium-orbit-one" />
          <div className="premium-orbit premium-orbit-two" />
          <div className="premium-hero-halo" />
          <div className="premium-hero-product">
            {heroImage ? <Image src={heroImage} alt={heroAlt} fill priority sizes="(min-width: 1024px) 38vw, 72vw" /> : <Image src="/brand/salora-logo-dark.jpeg" alt="SALORA" fill priority sizes="320px" />}
          </div>
          {heroProduct ? (
            <>
              <div className="premium-floating-card premium-card-name"><small>01</small><b>{displayCategory(heroProduct, language)}</b><span>{displayName(heroProduct, language)}</span></div>
              <div className="premium-floating-card premium-card-price"><small>OMR</small><b>{heroProduct.price.toFixed(3)}</b></div>
            </>
          ) : null}
        </div>
        <p className="premium-scroll-note">{t.scroll}<ArrowDown aria-hidden="true" /></p>
      </section>

      <section id="featured-menu" className="premium-menu-preview">
        <div className="premium-section-heading">
          <div><p className="premium-kicker"><span />{t.selection}</p><h2>{t.menuTitle}</h2></div>
          <div><p>{t.menuIntro}</p><small className={menuStale ? "is-stale" : ""}>{menuStale ? t.fallback : t.live} · {menuSource}</small></div>
        </div>
        <div className="premium-product-grid">
          {featuredProducts.map((product, index) => {
            const image = publicImage(product);
            return (
              <article className="premium-product-card" key={product.id}>
                <Link href="/menu" className="premium-product-visual" aria-label={`${t.customize}: ${displayName(product, language)}`}>
                  {image ? <Image src={image} alt={displayName(product, language)} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" /> : <Image src="/brand/salora-logo-dark.jpeg" alt="" fill sizes="360px" />}
                  {product.featured ? <span>{rtl ? "اختيار سالورا" : "SALORA pick"}</span> : null}
                  <small>0{index + 1}</small>
                </Link>
                <div className="premium-product-body">
                  <div><p>{displayCategory(product, language)}</p><h3>{displayName(product, language)}</h3><span>{displayDescription(product, language)}</span></div>
                  <div className="premium-product-footer"><strong><small>{t.from}</small>{product.price.toFixed(3)} <em>OMR</em></strong><Link href="/menu">{t.customize}<ArrowUpLeft aria-hidden="true" /></Link></div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="premium-menu-link"><Link className="premium-button premium-button-gold" href="/menu"><Menu aria-hidden="true" />{t.explore}</Link></div>
      </section>

      <section id="story" className="premium-story">
        <div className="premium-story-visual"><div /><Image src="/brand/salora-logo-dark.jpeg" alt="SALORA" width={220} height={220} /><p>EST. SALALAH<br />2026</p></div>
        <div className="premium-story-copy"><p className="premium-kicker"><span />{t.storyLabel}</p><h2>{t.storyTitle}</h2><p>{t.storyBody}</p><a href="#visit">{t.location}<ArrowUpLeft aria-hidden="true" /></a></div>
      </section>

      <section id="visit" className="premium-visit">
        <div><p className="premium-kicker"><span />{t.visitLabel}</p><h2>{t.visit}</h2><p>{t.city}</p></div>
        <div className="premium-visit-actions"><p>{t.hours}</p><a href="https://maps.google.com/?q=17.011517,54.174511" target="_blank" rel="noreferrer"><MapPin aria-hidden="true" />{t.directions}</a><a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />{t.whatsapp}</a></div>
      </section>

      <footer className="premium-footer">
        <div className="premium-footer-word">SALORA</div>
        <div><p>{t.footer}</p><p>© 2026 SALORA.CAFE</p><a href="https://instagram.com/salora.cafe" target="_blank" rel="noreferrer"><Instagram aria-hidden="true" />@salora.cafe</a></div>
      </footer>
    </main>
  );
}
