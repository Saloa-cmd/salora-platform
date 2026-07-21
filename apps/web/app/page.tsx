import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowRight, Bot, BriefcaseBusiness, Gem, Gift, Instagram, MessageCircle, Sparkles, Store, Users, type LucideIcon } from "lucide-react";
import { ConciergePreview } from "@/components/ConciergePreview";
import { FadeIn, HeroMotion } from "@/components/Motion";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";
import { featuredWhatsAppUrl } from "@/lib/whatsapp";
import { getPublishedExperienceConfiguration } from "@/lib/server/experienceConfig";

const nav = ["Story", "Menu", "Concierge", "Loyalty", "Careers"];
export const dynamic = "force-dynamic";

const loyaltyItems: Array<{ icon: LucideIcon; title: string; copy: string }> = [
  { icon: Gift, title: "Points", copy: "Earn future SALORA points for every order and pairing." },
  { icon: Gem, title: "Rewards", copy: "Unlock signature drinks, dessert moments, and seasonal offers." },
  { icon: Users, title: "VIP experiences", copy: "Prepare member-only tastings and personalized concierge journeys." }
];

export default async function HomePage() {
  const [menuSnapshot, experience] = await Promise.all([getPublicMenuSnapshot(), getPublishedExperienceConfiguration()]);
  const products = menuSnapshot.products;
  const signature = products.filter((product) => ["iced-matcha-vanilla", "spanish-latte", "pistachio-latte", "signature-cold-brew"].includes(product.id));
  const matcha = products.filter((product) => ["ceremonial-matcha", "strawberry-matcha-cream", "iced-matcha-vanilla"].includes(product.id));
  const desserts = products.filter((product) => product.category === "Dessert" && product.id !== "strawberry-matcha-cream");

  return (
    <main id="main-content" className="min-h-screen overflow-hidden" style={{ backgroundColor: experience.theme.backgroundColor, color: experience.theme.textColor, "--gold": experience.theme.primaryColor, "--gold-soft": experience.theme.primaryColor, "--cream": experience.theme.textColor, "--muted": experience.theme.mutedColor } as CSSProperties}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8" aria-label="Primary">
          <a href="#" className="flex items-center gap-3">
            <Image src="/brand/salora-logo-dark.jpeg" alt="SALORA logo" width={34} height={34} className="rounded-full border border-gold/25" priority />
            <span className="text-lg font-semibold tracking-[0.24em] text-cream">SALORA</span>
          </a>
          <div className="hidden items-center gap-7 md:flex">
            {nav.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-muted transition hover:text-cream">
                {item}
              </a>
            ))}
          </div>
          <a href={featuredWhatsAppUrl} aria-label="Start a SALORA order in WhatsApp" className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-sm font-medium text-goldSoft transition hover:bg-gold/20">
            <MessageCircle size={16} />
            WhatsApp
          </a>
        </nav>
      </header>
      {experience.site.showAnnouncement ? <div className="fixed inset-x-0 top-[73px] z-40 bg-gold px-4 py-2 text-center text-sm font-semibold text-black">{experience.site.announcementEn}</div> : null}
      {menuSnapshot.stale ? (
        <div className="fixed inset-x-0 top-[73px] z-40 border-b border-amber-300/30 bg-amber-950/80 px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 backdrop-blur">
          Menu data is in fallback mode
        </div>
      ) : null}

      <section className="relative px-5 pb-24 pt-32 md:pt-40">
        <div className="hero-depth" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <HeroMotion>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.28em] text-goldSoft">
              <Sparkles size={14} />
              Premium AI Cafe Platform
            </p>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] text-cream md:text-7xl">
              {experience.site.heroTitleEn}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              {experience.site.heroSubtitleEn}
            </p>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {["Mood-led menu", "WhatsApp-ready", "Loyalty-ready"].map((metric) => (
                <div key={metric} className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-cream">
                  {metric}
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="/menu" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-black transition hover:bg-goldSoft">
                Explore the digital menu
                <ArrowRight size={18} />
              </a>
              <a href={featuredWhatsAppUrl} className="inline-flex items-center justify-center rounded-full border border-white/12 px-6 py-3 font-semibold text-cream transition hover:border-gold/35">
                Quick WhatsApp order
              </a>
            </div>
          </HeroMotion>

          <HeroMotion className="luxury-frame rounded-lg p-4 shadow-luxury">
            <div className="product-visual min-h-[470px]">
              <Image src="/brand/salora-logo-dark.jpeg" alt="SALORA coffee, matcha, and desserts emblem" width={132} height={132} className="absolute right-5 top-5 rounded-full border border-gold/20 shadow-glow" priority />
              <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs uppercase tracking-[0.22em] text-goldSoft backdrop-blur">Signature Matcha</div>
              <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/10 bg-black/55 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-matcha/20 text-matcha">
                    <Bot size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-cream">AI pairing ready</p>
                    <p className="text-xs text-muted">Iced Matcha Vanilla + Saffron Milk Cake</p>
                  </div>
                </div>
              </div>
            </div>
          </HeroMotion>
        </div>
      </section>

      <section id="story" className="section-band px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="SALORA story" title="Hospitality, taste, and intelligence in one calm ritual." copy="SALORA is designed as a premium cafe ecosystem where handcrafted drinks, mood-aware recommendations, and boutique service meet. It begins with local-first ordering and grows toward AI-assisted hospitality." />
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Taste", "Signature matcha, specialty coffee, and desserts with pairing logic."],
              ["Mood", "Recommendations shaped around cold, sweet, light, and dessert-paired cravings."],
              ["Hospitality", "A calm ordering journey prepared for WhatsApp and future concierge service."],
              ["Technology", "Phase 1 architecture ready for Supabase, admin, loyalty, and future AI APIs."]
            ].map(([title, copy]) => (
              <FadeIn key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-xl font-semibold text-cream">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted">{copy}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="menu" className="section-band px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Signature drinks" title="A focused menu built for memory." copy="The first SALORA menu favors fewer, stronger signatures: matcha, espresso, cream, and considered dessert pairings." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {signature.map((product, index) => (
              <FadeIn key={product.id} delay={index * 0.05}>
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Matcha house" title="Ceremonial calm, iced signatures, soft pairings." />
          <div className="grid gap-5 md:grid-cols-3">
            {matcha.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Dessert pairings" title="Desserts designed as part of the order, not an afterthought." />
          <div className="grid gap-5 md:grid-cols-3">
            {desserts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section id="concierge" className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-goldSoft">AI concierge</p>
            <h2 className="mt-4 text-3xl font-semibold text-cream md:text-5xl">Mood-aware guidance without adding friction.</h2>
            <p className="mt-5 text-base leading-8 text-muted">
              The Phase 1 concierge uses transparent local rules to recommend drinks by mood, pair desserts, and prepare the interface for future voice, model-powered recommendations, and WhatsApp ordering.
            </p>
          </div>
          <ConciergePreview />
        </div>
      </section>

      <section id="loyalty" className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {loyaltyItems.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/[0.045] p-7">
              <Icon className="text-goldSoft" size={24} />
              <h3 className="mt-6 text-2xl font-semibold text-cream">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="careers" className="px-5 py-20">
        <div className="mx-auto max-w-7xl rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(201,164,92,0.12),rgba(255,255,255,0.04))] p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <BriefcaseBusiness className="text-goldSoft" />
              <h2 className="mt-5 text-3xl font-semibold text-cream md:text-5xl">Build the SALORA bar.</h2>
              <p className="mt-5 text-base leading-8 text-muted">We are preparing roles for professional baristas, matcha specialists, and pastry creators who understand precision, calm service, and premium craft.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Professional barista", "Matcha specialist", "Pastry / dessert creator"].map((role) => (
                <div key={role} className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-cream">{role}</div>
              ))}
            </div>
          </div>
          <a href="mailto:careers@salora.cafe" className="mt-8 inline-flex rounded-full bg-cream px-6 py-3 font-semibold text-black">Apply to join SALORA</a>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-8">
            <Store className="text-goldSoft" />
            <h2 className="mt-5 text-3xl font-semibold text-cream">A premium cafe brand with platform discipline.</h2>
          </div>
          <p className="self-end text-base leading-8 text-muted">
            SALORA is positioned as a future-ready hospitality ecosystem: memorable product, AI-assisted choice, scalable ordering, loyalty, and admin-ready architecture. Phase 1 demonstrates the brand and product spine without pretending the backend is already live.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_1fr_1fr]">
          <div>
            <p className="text-lg font-semibold tracking-[0.24em] text-cream">SALORA</p>
            <p className="mt-4 text-sm text-muted">App coming soon. Premium AI cafe platform foundation.</p>
          </div>
          <div className="space-y-2 text-sm text-muted">
            <p>Contact: hello@salora.cafe</p>
            <p>WhatsApp: +968 0000 0000</p>
            <p>Location: Muscat, Oman placeholder</p>
          </div>
          <div className="flex items-start gap-3 md:justify-end">
            <a href="https://instagram.com/salora.cafe" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-muted">
              <Instagram size={16} />
              Instagram
            </a>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl text-xs text-muted">&copy; 2026 SALORA / Salora.Cafe. Phase 1.5 showcase foundation.</p>
      </footer>
    </main>
  );
}
