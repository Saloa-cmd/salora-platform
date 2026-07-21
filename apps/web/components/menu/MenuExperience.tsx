"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import {
  Car,
  Check,
  ChevronDown,
  Coffee,
  Gift,
  Languages,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X
} from "lucide-react";
import type { ExperienceConfiguration, Product, ProductChoice, ProductModifierGroup, SelectedModifier } from "@salora/types";
import { SaloraButton, SaloraEmptyState } from "@/components/ui/SaloraPrimitives";

type Language = "ar" | "en";
type ServiceMode = "counter" | "car" | "dine-in" | "gift";
type CartLine = { key: string; product: Product; quantity: number; modifiers: SelectedModifier[]; unitPrice: number };

const copy = {
  ar: {
    direction: "rtl" as const,
    eyebrow: "مينيو سالورا الرقمي",
    title: "اختر لحظتك، ونحن نحضّر الانسجام.",
    intro: "منيو متصل مباشرة بمنصة SALORA، قابل للتخصيص والاستلام من الكاونتر أو أمام البحر.",
    search: "ابحث عن مشروب أو حلوى",
    all: "الكل",
    add: "خصص وأضف",
    cart: "طلبك",
    empty: "أضف منتجًا لتبدأ لحظة سالورا.",
    checkout: "تأكيد الطلب عبر واتساب",
    subtotal: "الإجمالي",
    customize: "خصص اختيارك",
    size: "الحجم",
    milk: "الحليب",
    sugar: "السكر",
    ice: "الثلج",
    regular: "عادي",
    large: "كبير",
    oat: "شوفان",
    almond: "لوز",
    none: "بدون",
    less: "قليل",
    light: "خفيف",
    confirm: "أضف إلى الطلب",
    live: "بيانات مباشرة",
    fallback: "وضع العرض الاحتياطي",
    orderSaved: "تم حفظ الطلب. سيتم فتح واتساب للتأكيد.",
    orderFailed: "تعذر حفظ الطلب الآن. يمكنك إرساله عبر واتساب دون فقد التفاصيل.",
    customerName: "الاسم",
    phone: "رقم الهاتف",
    carDetails: "نوع السيارة ولونها",
    notes: "ملاحظات الطلب",
    required: "أدخل الاسم ورقم الهاتف قبل التأكيد.",
    service: "طريقة الاستلام",
    standard: "كما هو من سالورا",
    results: "صنف متاح",
    noResults: "لا توجد نتائج مطابقة. جرّب بحثًا أو تصنيفًا آخر."
  },
  en: {
    direction: "ltr" as const,
    eyebrow: "SALORA digital menu",
    title: "Choose your moment. We prepare the harmony.",
    intro: "A customizable menu connected to SALORA, ready for counter or beachfront pickup.",
    search: "Search drinks or desserts",
    all: "All",
    add: "Customize & add",
    cart: "Your order",
    empty: "Add an item to begin your SALORA moment.",
    checkout: "Confirm order on WhatsApp",
    subtotal: "Subtotal",
    customize: "Customize your choice",
    size: "Size",
    milk: "Milk",
    sugar: "Sugar",
    ice: "Ice",
    regular: "Regular",
    large: "Large",
    oat: "Oat",
    almond: "Almond",
    none: "None",
    less: "Less",
    light: "Light",
    confirm: "Add to order",
    live: "Live data",
    fallback: "Fallback preview",
    orderSaved: "Order saved. WhatsApp will open for confirmation.",
    orderFailed: "The order could not be saved. You can still send the full details on WhatsApp.",
    customerName: "Name",
    phone: "Phone number",
    carDetails: "Car model and color",
    notes: "Order notes",
    required: "Enter your name and phone number before checkout.",
    service: "Pickup method",
    standard: "SALORA standard",
    results: "items available",
    noResults: "No matching items. Try another search or category."
  }
};

const serviceModes = [
  { id: "counter" as const, ar: "استلام من الكاونتر", en: "Counter pickup", icon: Store },
  { id: "car" as const, ar: "استلام أمام البحر", en: "Beachfront pickup", icon: Car },
  { id: "dine-in" as const, ar: "داخل سالورا", en: "Dine in", icon: UtensilsCrossed },
  { id: "gift" as const, ar: "أرسل لحظة سالورا", en: "Send a SALORA moment", icon: Gift }
];

const arabicNames: Record<string, string> = {
  "american-cheese-cake": "تشيز كيك أمريكي",
  americano: "أمريكانو",
  cappuccino: "كابتشينو",
  "cold-brew": "كولد برو",
  espresso: "إسبريسو",
  "flat-white": "فلات وايت",
  "iced-americano": "آيس أمريكانو",
  "iced-latte": "آيس لاتيه",
  "iced-spanish-latte": "سبانش لاتيه بارد",
  "lemon-mint": "ليمون ونعناع",
  "pistachio-latte": "لاتيه بستاشيو",
  "red-velvet": "ريد فيلفت",
  "san-sabastian": "سان سباستيان"
};

function optionLabel(language: Language, value: string) {
  const labels = copy[language] as Record<string, string>;
  return labels[value] ?? value;
}

function displayName(product: Product, language: Language) {
  return language === "ar"
    ? product.nameAr ?? arabicNames[product.id] ?? product.name
    : product.nameEn ?? product.name;
}

function displayCategory(product: Product, language: Language) {
  return language === "ar"
    ? product.categoryAr ?? product.category
    : product.categoryEn ?? product.category;
}

function displayDescription(product: Product, language: Language) {
  return language === "ar"
    ? product.descriptionAr ?? product.description ?? product.story
    : product.descriptionEn ?? product.description ?? product.story;
}

function productImage(product: Product) {
  return /^https:\/\//i.test(product.visual) ? product.visual : undefined;
}

function formatOmr(value: number, language: Language) {
  return language === "ar" ? `${value.toFixed(3)} ر.ع` : `OMR ${value.toFixed(3)}`;
}

function productAccent(product: Product) {
  const text = `${product.category} ${product.tags.join(" ")}`.toLowerCase();
  if (text.includes("matcha")) return "from-[#8fa47c]/35 via-[#1b2017] to-black";
  if (text.includes("dessert") || text.includes("cake")) return "from-[#c9a45c]/30 via-[#2a1d17] to-black";
  if (text.includes("juice") || text.includes("cold")) return "from-[#729f9b]/30 via-[#142120] to-black";
  return "from-[#6d412d]/40 via-[#20140f] to-black";
}

function supportsDrinkOptions(product: Product) {
  const category = product.category.toLowerCase();
  return !category.includes("dessert") && !category.includes("cake");
}

function fallbackGroups(product: Product, language: Language): ProductModifierGroup[] {
  if (!supportsDrinkOptions(product)) return [];
  const label = (ar: string, en: string) => language === "ar" ? ar : en;
  return [
    { id: "size", name: label("الحجم", "Size"), required: true, options: [{ id: "regular", name: label("عادي", "Regular"), priceDelta: 0 }, { id: "large", name: label("كبير", "Large"), priceDelta: 0.3 }] },
    { id: "milk", name: label("الحليب", "Milk"), required: true, options: [{ id: "regular", name: label("عادي", "Regular"), priceDelta: 0 }, { id: "oat", name: label("شوفان", "Oat"), priceDelta: 0.25 }, { id: "almond", name: label("لوز", "Almond"), priceDelta: 0.25 }] },
    { id: "sugar", name: label("السكر", "Sugar"), required: true, options: [{ id: "none", name: label("بدون", "None"), priceDelta: 0 }, { id: "less", name: label("قليل", "Less"), priceDelta: 0 }, { id: "regular", name: label("عادي", "Regular"), priceDelta: 0 }] },
    { id: "ice", name: label("الثلج", "Ice"), required: true, options: [{ id: "none", name: label("بدون", "None"), priceDelta: 0 }, { id: "light", name: label("خفيف", "Light"), priceDelta: 0 }, { id: "regular", name: label("عادي", "Regular"), priceDelta: 0 }] }
  ];
}

function productGroups(product: Product, language: Language): ProductModifierGroup[] {
  const databaseGroups: ProductModifierGroup[] = [
    ...(product.variants?.length ? [{ id: "variant", name: language === "ar" ? "الحجم / النوع" : "Size / variant", required: true, options: product.variants }] : []),
    ...(product.modifierGroups ?? []),
    ...(product.addons?.length ? [{ id: "addons", name: language === "ar" ? "الإضافات" : "Add-ons", required: false, options: product.addons }] : [])
  ];
  return databaseGroups.length ? databaseGroups : fallbackGroups(product, language);
}

export function MenuExperience({ initialProducts, menuSource, menuStale, whatsappNumber, experience }: { initialProducts: Product[]; menuSource: "database" | "fallback"; menuStale: boolean; whatsappNumber: string; experience: ExperienceConfiguration }) {
  const [language, setLanguage] = useState<Language>("ar");
  const [serviceMode, setServiceMode] = useState<ServiceMode>("counter");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selections, setSelections] = useState<Record<string, ProductChoice>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [carDetails, setCarDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const t = copy[language];

  const categories = useMemo(() => ["All", ...Array.from(new Set(initialProducts.map((product) => product.category)))], [initialProducts]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialProducts.filter((product) => {
      const categoryMatch = category === "All" || product.category === category;
      const searchMatch = !query || `${product.name} ${product.nameAr ?? arabicNames[product.id] ?? ""} ${product.nameEn ?? ""} ${product.category} ${product.categoryAr ?? ""} ${product.categoryEn ?? ""} ${product.tags.join(" ")}`.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [category, initialProducts, search]);
  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const selectedGroups = selectedProduct ? productGroups(selectedProduct, language) : [];
  const selectedModifiers: SelectedModifier[] = selectedGroups.flatMap((group) => {
    const option = selections[group.id];
    return option ? [{ groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, priceDelta: option.priceDelta }] : [];
  });
  const selectedUnitPrice = selectedProduct ? Number((selectedProduct.price + selectedModifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0)).toFixed(3)) : 0;
  const requiredSelectionsComplete = selectedGroups.filter((group) => group.required).every((group) => selections[group.id]);

  function openProduct(product: Product) {
    setSelectedProduct(product);
    const groups = productGroups(product, language);
    setSelections(groups.reduce<Record<string, ProductChoice>>((initial, group) => { const option = group.options[0]; if (group.required && option) initial[group.id] = option; return initial; }, {}));
  }

  function addSelectedProduct() {
    if (!selectedProduct) return;
    if (!requiredSelectionsComplete) return;
    const unitPrice = selectedUnitPrice;
    const modifiers = selectedModifiers;
    const key = `${selectedProduct.id}:${modifiers.map((modifier) => `${modifier.groupId}=${modifier.optionId}`).sort().join("|")}`;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) return current.map((line) => line.key === key ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { key, product: selectedProduct, quantity: 1, modifiers, unitPrice }];
    });
    setSelectedProduct(null);
    setCartOpen(true);
  }

  function changeQuantity(key: string, delta: number) {
    setCart((current) => current.map((line) => line.key === key ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0));
  }

  function whatsappMessage() {
    const service = serviceModes.find((mode) => mode.id === serviceMode);
    const lines = cart.map((line) => {
      const detail = line.modifiers.length ? line.modifiers.map((modifier) => modifier.optionName).join(" · ") : t.standard;
      return `${line.quantity}× ${displayName(line.product, language)} — ${detail} — ${formatOmr(line.unitPrice * line.quantity, language)}`;
    });
    return [
      language === "ar" ? "طلب جديد من SALORA" : "New SALORA order",
      `${t.customerName}: ${name}`,
      `${t.phone}: ${phone}`,
      `${t.service}: ${language === "ar" ? service?.ar : service?.en}`,
      serviceMode === "car" && carDetails ? `${t.carDetails}: ${carDetails}` : "",
      "",
      ...lines,
      "",
      `${t.subtotal}: ${formatOmr(subtotal, language)}`,
      notes ? `${t.notes}: ${notes}` : ""
    ].filter(Boolean).join("\n");
  }

  async function checkout() {
    if (!name.trim() || !phone.trim()) {
      setNotice(t.required);
      return;
    }
    const normalizedNumber = whatsappNumber.replace(/\D/g, "");
    const whatsappWindow = normalizedNumber && normalizedNumber !== "96800000000"
      ? window.open("about:blank", "_blank")
      : null;
    if (whatsappWindow) whatsappWindow.opener = null;
    setSubmitting(true);
    setNotice("");
    let persisted = false;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          items: cart.map((line) => ({
            productName: line.product.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            modifiers: line.modifiers
          })),
          notes: [serviceMode, carDetails, notes].filter(Boolean).join(" | ")
        })
      });
      persisted = response.ok;
    } catch {
      persisted = false;
    }
    setNotice(persisted ? t.orderSaved : t.orderFailed);
    if (whatsappWindow) whatsappWindow.location.href = `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(whatsappMessage())}`;
    setSubmitting(false);
  }

  const experienceStyle = {
    "--gold": experience.theme.primaryColor,
    "--gold-soft": experience.theme.primaryColor,
    "--border-gold": `${experience.theme.primaryColor}66`,
    "--cream": experience.theme.textColor,
    "--muted": experience.theme.mutedColor,
    backgroundColor: experience.theme.backgroundColor,
    color: experience.theme.textColor
  } as CSSProperties;
  const gridClass = experience.menu.layout === "list" ? "grid-cols-1" : experience.menu.columns === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : experience.menu.columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3";
  const ratioClass = experience.menu.cardRatio === "square" ? "aspect-square" : experience.menu.cardRatio === "portrait" ? "aspect-[4/5]" : "aspect-[16/10]";
  const menuBanners = experience.banners.filter((banner) => banner.active && (banner.placement === "menu" || banner.placement === "both")).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main dir={t.direction} style={experienceStyle} className="min-h-screen text-[var(--cream)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="SALORA home">
            {experience.site.logoUrl ? <span aria-label="SALORA logo" className="h-11 w-11 rounded-full border border-[var(--border-gold)] bg-cover bg-center" style={{ backgroundImage: `url(${experience.site.logoUrl})` }} /> : <Image src="/brand/salora-logo-dark.jpeg" alt="SALORA" width={44} height={44} priority className="h-11 w-11 rounded-full border border-[var(--border-gold)] object-cover shadow-[0_0_24px_rgba(201,164,92,0.18)]" />}
            <span><strong className="block tracking-[0.24em]">SALORA</strong><small className="text-[var(--muted)]">Taste the Harmony</small></span>
          </Link>
          <div className="flex items-center gap-2">
            <SaloraButton type="button" onClick={() => setLanguage((value) => value === "ar" ? "en" : "ar")} className="min-h-10 rounded-full px-3 text-xs">
              <Languages className="h-4 w-4" /> {language === "ar" ? "English" : "العربية"}
            </SaloraButton>
            <SaloraButton type="button" tone="gold" onClick={() => setCartOpen(true)} className="relative min-h-10 rounded-full bg-[var(--gold)] px-4 text-black hover:bg-[var(--gold-soft)]">
              <ShoppingBag className="h-4 w-4" /> {t.cart}
              {itemCount ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[0.65rem] text-white">{itemCount}</span> : null}
            </SaloraButton>
          </div>
        </div>
      </header>

      {experience.site.showAnnouncement ? <div className="bg-[var(--gold)] px-4 py-2 text-center text-sm font-semibold text-black">{language === "ar" ? experience.site.announcementAr : experience.site.announcementEn}</div> : null}

      <section className="relative overflow-hidden border-b border-white/10 px-4 py-9 sm:px-6 sm:py-12 lg:py-14">
        <div className="hero-depth" />
        <div className={`mx-auto grid max-w-7xl gap-8 lg:items-center ${language === "ar" ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]" : "lg:grid-cols-[minmax(30rem,1.15fr)_minmax(25rem,0.85fr)]"}`}>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gold-soft)]"><Sparkles className="h-4 w-4" />{t.eyebrow}</p>
            <h1 className="salora-display mt-4 font-semibold">{language === "ar" ? experience.site.heroTitleAr : experience.site.heroTitleEn}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">{language === "ar" ? experience.site.heroSubtitleAr : experience.site.heroSubtitleEn}</p>
            <span className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${menuStale ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>
              <span className="h-2 w-2 rounded-full bg-current" /> {menuSource === "database" ? t.live : t.fallback}
            </span>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:gap-3">
            {serviceModes.map(({ id, ar, en, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={serviceMode === id} onClick={() => setServiceMode(id)} className={`flex min-h-14 items-center gap-3 rounded-2xl border p-3 text-start transition sm:p-4 ${serviceMode === id ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "border-white/10 bg-white/[0.04] text-[var(--muted)] hover:border-white/20"}`}>
                <Icon className="h-5 w-5 shrink-0" /><span className="text-sm font-semibold">{language === "ar" ? ar : en}</span>{serviceMode === id ? <Check className="ms-auto h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      {menuBanners.length ? <section className="mx-auto grid max-w-7xl gap-4 px-4 pt-8 sm:grid-cols-2 sm:px-6">{menuBanners.map((banner) => <Link key={banner.id} href={banner.linkUrl || "/menu"} className="relative min-h-40 overflow-hidden border border-white/10 bg-white/[0.04] p-6" style={{ borderRadius: `${experience.theme.borderRadius}px`, backgroundImage: banner.imageUrl ? `linear-gradient(90deg, rgba(0,0,0,.86), rgba(0,0,0,.18)), url(${banner.imageUrl})` : undefined, backgroundPosition: "center", backgroundSize: "cover" }}><h2 className="max-w-sm text-2xl font-semibold">{language === "ar" ? banner.titleAr : banner.titleEn}</h2><p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{language === "ar" ? banner.subtitleAr : banner.subtitleEn}</p></Link>)}</section> : null}

      <section id="menu-products" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {experience.menu.showSearch ? <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 lg:max-w-xl">
            <span className="sr-only">{t.search}</span><Search className="h-5 w-5 text-[var(--muted)]" aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" />
          </label> : null}
          {experience.menu.showCategories ? <div className="salora-scroll-strip" role="tablist" aria-label={language === "ar" ? "تصنيفات المنيو" : "Menu categories"}>
            {categories.map((item) => {
              const categoryProduct = initialProducts.find((product) => product.category === item);
              const label = item === "All" ? t.all : categoryProduct ? displayCategory(categoryProduct, language) : item;
              return <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`min-h-10 shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${category === item ? "border-[var(--gold)] bg-[var(--gold)] text-black" : "border-white/10 bg-white/[0.04] text-[var(--muted)] hover:border-white/25 hover:text-[var(--cream)]"}`}>{label}</button>;
            })}
          </div> : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4 text-sm text-[var(--muted)]" aria-live="polite">
          <span><strong className="text-[var(--cream)]">{filteredProducts.length}</strong> {t.results}</span>
          {search || category !== "All" ? <button type="button" onClick={() => { setSearch(""); setCategory("All"); }} className="text-xs font-semibold text-[var(--gold-soft)] hover:underline">{language === "ar" ? "مسح التصفية" : "Clear filters"}</button> : null}
        </div>

        <div className={`mt-8 grid gap-5 ${gridClass}`}>
          {filteredProducts.map((product) => (
            <article key={product.id} className={`group overflow-hidden border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-[var(--border-gold)] ${experience.menu.layout === "list" ? "sm:grid sm:grid-cols-[240px_1fr]" : ""}`} style={{ borderRadius: `${experience.theme.borderRadius}px` }}>
              {experience.menu.showImages ? <div className={`relative ${experience.menu.layout === "list" ? "min-h-48 sm:aspect-auto" : ratioClass} bg-gradient-to-br ${productAccent(product)}`}>
                {productImage(product) ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,.6), rgba(0,0,0,.05)), url("${productImage(product)}")` }} /> : null}
                <div className="absolute inset-0 grid place-items-center"><Coffee className="h-16 w-16 text-white/15" strokeWidth={1} /></div>
                {product.featured ? <span className="absolute start-4 top-4 rounded-full border border-[var(--border-gold)] bg-black/60 px-3 py-1 text-xs text-[var(--gold-soft)]">Signature</span> : null}
                <span className="absolute end-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white/70">{displayCategory(product, language)}</span>
              </div> : null}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{displayName(product, language)}</h2>{language === "ar" ? <p className="mt-1 text-xs text-[var(--muted)]">{product.name}</p> : null}</div><strong className="whitespace-nowrap text-[var(--gold-soft)]">{formatOmr(product.price, language)}</strong></div>
                {experience.menu.showDescriptions ? <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{displayDescription(product, language)}</p> : null}
                <button type="button" onClick={() => openProduct(product)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-gold)] bg-[var(--gold)]/10 px-4 py-3 text-sm font-semibold text-[var(--gold-soft)] transition hover:bg-[var(--gold)] hover:text-black">{t.add}<ChevronDown className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
        {filteredProducts.length === 0 ? <div className="mt-8"><SaloraEmptyState icon={<Search className="h-6 w-6" aria-hidden="true" />} title={language === "ar" ? "لا توجد أصناف مطابقة" : "No matching items"} description={t.noResults} action={<SaloraButton tone="gold" onClick={() => { setSearch(""); setCategory("All"); }}>{language === "ar" ? "عرض جميع الأصناف" : "Show all items"}</SaloraButton>} /></div> : null}
      </section>

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 grid items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t.customize}>
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111] p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-[var(--gold-soft)]">{t.customize}</p><h2 className="mt-2 text-2xl font-semibold">{displayName(selectedProduct, language)}</h2></div><button type="button" onClick={() => setSelectedProduct(null)} className="rounded-full border border-white/10 p-2"><X className="h-5 w-5" /></button></div>
            {selectedGroups.length ? (
              <div className="mt-7 grid gap-6">
                {selectedGroups.map((group) => (
                  <OptionGroup key={group.id} group={group} selected={selections[group.id]?.id} language={language} onChange={(option) => setSelections((current) => ({ ...current, [group.id]: option }))} />
                ))}
              </div>
            ) : <p className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--muted)]">{t.standard}</p>}
            <button type="button" disabled={!requiredSelectionsComplete} onClick={addSelectedProduct} className="mt-7 flex w-full items-center justify-between rounded-2xl bg-[var(--gold)] px-5 py-4 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"><span>{t.confirm}</span><span>{formatOmr(selectedUnitPrice, language)}</span></button>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t.cart}>
          <aside className={`absolute inset-y-0 w-full max-w-md overflow-y-auto border-white/10 bg-[#0d0d0d] p-5 shadow-2xl ${language === "ar" ? "left-0 border-r" : "right-0 border-l"}`}>
            <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">{t.cart}</h2><button type="button" onClick={() => setCartOpen(false)} className="rounded-full border border-white/10 p-2"><X className="h-5 w-5" /></button></div>
            {cart.length ? <div className="mt-6 grid gap-4">{cart.map((line) => <div key={line.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{displayName(line.product, language)}</h3><p className="mt-1 text-xs text-[var(--muted)]">{line.modifiers.length ? line.modifiers.map((modifier) => modifier.optionName).join(" · ") : t.standard}</p></div><span className="text-sm text-[var(--gold-soft)]">{formatOmr(line.unitPrice * line.quantity, language)}</span></div><div className="mt-4 flex items-center gap-3"><button type="button" onClick={() => changeQuantity(line.key, -1)} className="rounded-full border border-white/10 p-1"><Minus className="h-4 w-4" /></button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line.key, 1)} className="rounded-full border border-white/10 p-1"><Plus className="h-4 w-4" /></button></div></div>)}</div> : <p className="mt-10 text-center text-sm text-[var(--muted)]">{t.empty}</p>}
            {cart.length ? <div className="mt-7 grid gap-3 border-t border-white/10 pt-6"><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.customerName} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t.phone} inputMode="tel" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" />{serviceMode === "car" ? <input value={carDetails} onChange={(event) => setCarDetails(event.target.value)} placeholder={t.carDetails} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /> : null}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.notes} rows={3} className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /><div className="flex items-center justify-between py-2"><span className="text-[var(--muted)]">{t.subtotal}</span><strong className="text-xl text-[var(--gold-soft)]">{formatOmr(subtotal, language)}</strong></div>{notice ? <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-[var(--muted)]">{notice}</p> : null}<button type="button" disabled={submitting} onClick={checkout} className="rounded-2xl bg-[var(--gold)] px-5 py-4 font-semibold text-black disabled:opacity-50">{submitting ? "…" : t.checkout}</button></div> : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function OptionGroup({ group, selected, language, onChange }: { group: ProductModifierGroup; selected?: string; language: Language; onChange: (option: ProductChoice) => void }) {
  return <fieldset><legend className="mb-3 text-sm font-semibold text-[var(--muted)]">{group.name}{group.required ? " *" : ""}</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{group.options.map((option) => <button key={option.id} type="button" aria-pressed={selected === option.id} onClick={() => onChange(option)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${selected === option.id ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "border-white/10 text-[var(--muted)]"}`}><span className="block">{optionLabel(language, option.name)}</span>{option.priceDelta ? <small className="mt-1 block opacity-75">+{formatOmr(option.priceDelta, language)}</small> : null}</button>)}</div></fieldset>;
}
