"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
type PersistedOrder = {
  id: string;
  total: number | string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number | string;
    modifiers?: Array<{ optionName?: string }> | null;
  }>;
};

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
    orderFailed: "تعذر التحقق من السعر أو التوفر. راجع الطلب وحاول مرة أخرى.",
    customerName: "الاسم",
    phone: "رقم الهاتف",
    carDetails: "نوع السيارة ولونها",
    notes: "ملاحظات الطلب",
    required: "أدخل الاسم ورقم الهاتف قبل التأكيد.",
    service: "طريقة الاستلام",
    standard: "كما هو من سالورا",
    results: "صنف متاح",
    noResults: "لا توجد نتائج مطابقة. جرّب بحثًا أو تصنيفًا آخر.",
    browse: "تصفّح المنيو",
    changeService: "تغيير طريقة الاستلام",
    signature: "اختيار سالورا",
    clearFilters: "مسح التصفية",
    close: "إغلاق",
    decrease: "تقليل الكمية",
    increase: "زيادة الكمية",
    from: "يبدأ من"
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
    orderFailed: "Price or availability could not be verified. Review the order and try again.",
    customerName: "Name",
    phone: "Phone number",
    carDetails: "Car model and color",
    notes: "Order notes",
    required: "Enter your name and phone number before checkout.",
    service: "Pickup method",
    standard: "SALORA standard",
    results: "items available",
    noResults: "No matching items. Try another search or category.",
    browse: "Browse menu",
    changeService: "Change pickup method",
    signature: "SALORA pick",
    clearFilters: "Clear filters",
    close: "Close",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    from: "From"
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

  useEffect(() => {
    if (!selectedProduct && !cartOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedProduct(null);
      setCartOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [cartOpen, selectedProduct]);

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

  function whatsappMessage(order?: PersistedOrder) {
    const service = serviceModes.find((mode) => mode.id === serviceMode);
    const lines = order
      ? order.items.map((item) => {
          const detail = item.modifiers?.map((modifier) => modifier.optionName).filter(Boolean).join(" · ") || t.standard;
          return `${item.quantity}× ${item.productName} — ${detail} — ${formatOmr(Number(item.unitPrice) * item.quantity, language)}`;
        })
      : cart.map((line) => {
          const detail = line.modifiers.length ? line.modifiers.map((modifier) => modifier.optionName).join(" · ") : t.standard;
          return `${line.quantity}× ${displayName(line.product, language)} — ${detail} — ${formatOmr(line.unitPrice * line.quantity, language)}`;
        });
    const confirmedTotal = order ? Number(order.total) : subtotal;
    return [
      language === "ar" ? "طلب جديد من SALORA" : "New SALORA order",
      order ? `${language === "ar" ? "رقم الطلب" : "Order ID"}: ${order.id}` : "",
      `${t.customerName}: ${name}`,
      `${t.phone}: ${phone}`,
      `${t.service}: ${language === "ar" ? service?.ar : service?.en}`,
      serviceMode === "car" && carDetails ? `${t.carDetails}: ${carDetails}` : "",
      "",
      ...lines,
      "",
      `${t.subtotal}: ${formatOmr(confirmedTotal, language)}`,
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
    let persistedOrder: PersistedOrder | undefined;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          items: cart.map((line) => ({
            productSlug: line.product.id,
            quantity: line.quantity,
            modifiers: line.modifiers.map((modifier) => ({
              groupId: modifier.groupId,
              optionId: modifier.optionId
            }))
          })),
          notes: [serviceMode, carDetails, notes].filter(Boolean).join(" | ")
        })
      });
      const payload = await response.json().catch(() => null) as { data?: PersistedOrder } | null;
      persistedOrder = payload?.data;
      persisted = response.ok && Boolean(persistedOrder?.id);
    } catch {
      persisted = false;
    }
    setNotice(persisted ? t.orderSaved : t.orderFailed);
    if (whatsappWindow && persisted && persistedOrder) {
      whatsappWindow.location.href = `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(whatsappMessage(persistedOrder))}`;
    } else {
      whatsappWindow?.close();
    }
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
    <main lang={language} dir={t.direction} style={experienceStyle} className="min-h-screen text-[var(--cream)]">
      <a href="#menu-products" className="skip-link">{t.browse}</a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="SALORA home">
            {experience.site.logoUrl ? <span aria-label="SALORA logo" className="h-10 w-10 rounded-full border border-[var(--border-gold)] bg-cover bg-center sm:h-11 sm:w-11" style={{ backgroundImage: `url(${experience.site.logoUrl})` }} /> : <Image src="/brand/salora-logo-dark.jpeg" alt="SALORA" width={44} height={44} priority className="h-10 w-10 rounded-full border border-[var(--border-gold)] object-cover shadow-[0_0_24px_rgba(201,164,92,0.18)] sm:h-11 sm:w-11" />}
            <span><strong className="block text-sm tracking-[0.24em] sm:text-base">SALORA</strong><small className="hidden text-[var(--muted)] sm:block">Taste the Harmony</small></span>
          </Link>
          <div className="flex items-center gap-2">
            <SaloraButton type="button" aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"} onClick={() => setLanguage((value) => value === "ar" ? "en" : "ar")} className="min-h-11 rounded-full px-3 text-xs">
              <Languages className="h-4 w-4" /><span className="hidden sm:inline">{language === "ar" ? "English" : "العربية"}</span>
            </SaloraButton>
            <SaloraButton type="button" tone="gold" onClick={() => setCartOpen(true)} className="relative min-h-11 rounded-full bg-[var(--gold)] px-3 text-black hover:bg-[var(--gold-soft)] sm:px-4">
              <ShoppingBag className="h-4 w-4" /><span className="hidden sm:inline">{t.cart}</span>
              {itemCount ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[0.65rem] text-white">{itemCount}</span> : null}
            </SaloraButton>
          </div>
        </div>
      </header>

      {experience.site.showAnnouncement ? <div className="bg-[var(--gold)] px-4 py-2 text-center text-sm font-semibold text-black">{language === "ar" ? experience.site.announcementAr : experience.site.announcementEn}</div> : null}

      <section className="relative overflow-hidden border-b border-white/10 px-4 py-5 sm:px-6 sm:py-8">
        <div className="hero-depth" />
        <div className={`mx-auto grid max-w-7xl gap-5 lg:items-end ${language === "ar" ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]" : "lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]"}`}>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gold-soft)]"><Sparkles className="h-4 w-4" />{t.eyebrow}</p>
            <h1 className="salora-display salora-menu-display mt-2 font-semibold">{language === "ar" ? experience.site.heroTitleAr : experience.site.heroTitleEn}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:mt-3 sm:text-base sm:leading-7">{language === "ar" ? experience.site.heroSubtitleAr : experience.site.heroSubtitleEn}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href="#menu-products" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--gold)] px-5 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">{t.browse}</a>
            <span className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${menuStale ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>
              <span className="h-2 w-2 rounded-full bg-current" /> {menuSource === "database" ? t.live : t.fallback}
            </span>
            </div>
          </div>
          <fieldset className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-2 sm:rounded-3xl sm:p-3">
            <legend className="px-2 text-xs font-semibold text-[var(--muted)]">{t.service}</legend>
            <div className="salora-scroll-strip min-w-0 sm:grid sm:grid-cols-2 sm:gap-2">
            {serviceModes.map(({ id, ar, en, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={serviceMode === id} onClick={() => setServiceMode(id)} className={`flex min-h-11 min-w-[10.5rem] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-start transition sm:min-h-12 sm:min-w-0 sm:rounded-2xl sm:p-3 ${serviceMode === id ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "border-white/10 bg-black/20 text-[var(--muted)] hover:border-white/20"}`}>
                <Icon className="h-5 w-5 shrink-0" /><span className="text-sm font-semibold">{language === "ar" ? ar : en}</span>{serviceMode === id ? <Check className="ms-auto h-4 w-4" /> : null}
              </button>
            ))}
            </div>
          </fieldset>
        </div>
      </section>

      {menuBanners.length ? <section className="mx-auto grid max-w-7xl gap-4 px-4 pt-8 sm:grid-cols-2 sm:px-6">{menuBanners.map((banner) => <Link key={banner.id} href={banner.linkUrl || "/menu"} className="relative min-h-40 overflow-hidden border border-white/10 bg-white/[0.04] p-6" style={{ borderRadius: `${experience.theme.borderRadius}px`, backgroundImage: banner.imageUrl ? `linear-gradient(90deg, rgba(0,0,0,.86), rgba(0,0,0,.18)), url(${banner.imageUrl})` : undefined, backgroundPosition: "center", backgroundSize: "cover" }}><h2 className="max-w-sm text-2xl font-semibold">{language === "ar" ? banner.titleAr : banner.titleEn}</h2><p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{language === "ar" ? banner.subtitleAr : banner.subtitleEn}</p></Link>)}</section> : null}

      <section id="menu-products" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-5 sm:scroll-mt-[4.5rem] sm:px-6 sm:py-8">
        <div className="sticky top-16 z-30 -mx-4 border-y border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl sm:top-[4.5rem] sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center">
          {experience.menu.showSearch ? <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 lg:max-w-xl">
            <span className="sr-only">{t.search}</span><Search className="h-5 w-5 text-[var(--muted)]" aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" />
          </label> : null}
          {experience.menu.showCategories ? <div className="salora-scroll-strip lg:flex-1" role="tablist" aria-label={language === "ar" ? "تصنيفات المنيو" : "Menu categories"}>
            {categories.map((item) => {
              const categoryProduct = initialProducts.find((product) => product.category === item);
              const label = item === "All" ? t.all : categoryProduct ? displayCategory(categoryProduct, language) : item;
              const count = item === "All" ? initialProducts.length : initialProducts.filter((product) => product.category === item).length;
              return <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${category === item ? "border-[var(--gold)] bg-[var(--gold)] text-black" : "border-white/10 bg-white/[0.04] text-[var(--muted)] hover:border-white/25 hover:text-[var(--cream)]"}`}>{label}<span className="ms-2 opacity-65">{count}</span></button>;
            })}
          </div> : null}
        </div></div>

        <div className="mt-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4 text-sm text-[var(--muted)]" aria-live="polite">
          <span><strong className="text-[var(--cream)]">{filteredProducts.length}</strong> {t.results}</span>
          {search || category !== "All" ? <button type="button" onClick={() => { setSearch(""); setCategory("All"); }} className="min-h-11 text-xs font-semibold text-[var(--gold-soft)] hover:underline">{t.clearFilters}</button> : null}
        </div>

        <div className={`mt-5 grid gap-4 sm:mt-7 sm:gap-5 ${gridClass}`}>
          {filteredProducts.map((product) => (
            <MenuProductCard key={product.id} product={product} language={language} showImages={experience.menu.showImages} showDescriptions={experience.menu.showDescriptions} ratioClass={ratioClass} list={experience.menu.layout === "list"} radius={experience.theme.borderRadius} onSelect={openProduct} />
          ))}
        </div>
        {filteredProducts.length === 0 ? <div className="mt-8"><SaloraEmptyState icon={<Search className="h-6 w-6" aria-hidden="true" />} title={language === "ar" ? "لا توجد أصناف مطابقة" : "No matching items"} description={t.noResults} action={<SaloraButton tone="gold" onClick={() => { setSearch(""); setCategory("All"); }}>{language === "ar" ? "عرض جميع الأصناف" : "Show all items"}</SaloraButton>} /></div> : null}
      </section>

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 grid items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t.customize}>
          <div className="salora-safe-bottom max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111] p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7">
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-white/20 sm:hidden" aria-hidden="true" />
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-[var(--gold-soft)]">{t.customize}</p><h2 className="mt-2 text-2xl font-semibold">{displayName(selectedProduct, language)}</h2></div><button type="button" aria-label={t.close} onClick={() => setSelectedProduct(null)} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-white/10"><X className="h-5 w-5" /></button></div>
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
            <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">{t.cart}</h2><button type="button" aria-label={t.close} onClick={() => setCartOpen(false)} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-white/10"><X className="h-5 w-5" /></button></div>
            {cart.length ? <div className="mt-6 grid gap-4">{cart.map((line) => <div key={line.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{displayName(line.product, language)}</h3><p className="mt-1 text-xs text-[var(--muted)]">{line.modifiers.length ? line.modifiers.map((modifier) => modifier.optionName).join(" · ") : t.standard}</p></div><span className="text-sm text-[var(--gold-soft)]">{formatOmr(line.unitPrice * line.quantity, language)}</span></div><div className="mt-4 flex items-center gap-3"><button type="button" aria-label={`${t.decrease}: ${displayName(line.product, language)}`} onClick={() => changeQuantity(line.key, -1)} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-white/10"><Minus className="h-4 w-4" /></button><span className="min-w-6 text-center font-semibold">{line.quantity}</span><button type="button" aria-label={`${t.increase}: ${displayName(line.product, language)}`} onClick={() => changeQuantity(line.key, 1)} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-white/10"><Plus className="h-4 w-4" /></button></div></div>)}</div> : <p className="mt-10 text-center text-sm text-[var(--muted)]">{t.empty}</p>}
            {cart.length ? <div className="mt-7 grid gap-3 border-t border-white/10 pt-6"><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.customerName} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t.phone} inputMode="tel" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" />{serviceMode === "car" ? <input value={carDetails} onChange={(event) => setCarDetails(event.target.value)} placeholder={t.carDetails} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /> : null}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.notes} rows={3} className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /><div className="flex items-center justify-between py-2"><span className="text-[var(--muted)]">{t.subtotal}</span><strong className="text-xl text-[var(--gold-soft)]">{formatOmr(subtotal, language)}</strong></div>{notice ? <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-[var(--muted)]">{notice}</p> : null}<button type="button" disabled={submitting} onClick={checkout} className="rounded-2xl bg-[var(--gold)] px-5 py-4 font-semibold text-black disabled:opacity-50">{submitting ? "…" : t.checkout}</button></div> : null}
          </aside>
        </div>
      ) : null}
      {itemCount > 0 && !cartOpen ? <button type="button" onClick={() => setCartOpen(true)} className="fixed inset-x-4 bottom-4 z-40 flex min-h-14 items-center justify-between rounded-2xl bg-[var(--gold)] px-5 font-semibold text-black shadow-[0_18px_50px_rgba(0,0,0,.45)] sm:hidden"><span>{t.cart} · {itemCount}</span><span>{formatOmr(subtotal, language)}</span></button> : null}
    </main>
  );
}

function OptionGroup({ group, selected, language, onChange }: { group: ProductModifierGroup; selected?: string; language: Language; onChange: (option: ProductChoice) => void }) {
  return <fieldset><legend className="mb-3 text-sm font-semibold text-[var(--muted)]">{group.name}{group.required ? " *" : ""}</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{group.options.map((option) => <button key={option.id} type="button" aria-pressed={selected === option.id} onClick={() => onChange(option)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${selected === option.id ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "border-white/10 text-[var(--muted)]"}`}><span className="block">{optionLabel(language, option.name)}</span>{option.priceDelta ? <small className="mt-1 block opacity-75">+{formatOmr(option.priceDelta, language)}</small> : null}</button>)}</div></fieldset>;
}

function MenuProductCard({ product, language, showImages, showDescriptions, ratioClass, list, radius, onSelect }: { product: Product; language: Language; showImages: boolean; showDescriptions: boolean; ratioClass: string; list: boolean; radius: number; onSelect: (product: Product) => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const t = copy[language];
  const image = productImage(product);
  const tags = product.tags.slice(0, 2);

  return (
    <article className={`group overflow-hidden border border-white/10 bg-white/[0.04] shadow-[0_18px_50px_rgba(0,0,0,.16)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-gold)] ${list ? "sm:grid sm:grid-cols-[240px_1fr]" : ""}`} style={{ borderRadius: `${radius}px` }}>
      {showImages ? (
        <button type="button" onClick={() => onSelect(product)} aria-label={`${t.customize}: ${displayName(product, language)}`} className={`relative block w-full overflow-hidden ${list ? "min-h-48 sm:aspect-auto" : ratioClass} bg-gradient-to-br ${productAccent(product)}`}>
          {image && !imageFailed ? <Image src={image} alt={displayName(product, language)} fill sizes={list ? "(min-width: 640px) 240px, 100vw" : "(min-width: 1280px) 31vw, (min-width: 640px) 48vw, 100vw"} className="object-cover transition duration-500 group-hover:scale-[1.025]" onError={() => setImageFailed(true)} /> : <span className="absolute inset-0 grid place-items-center"><Coffee className="h-16 w-16 text-white/20" strokeWidth={1} /><span className="sr-only">{language === "ar" ? "صورة بديلة للمنتج" : "Product image fallback"}</span></span>}
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" aria-hidden="true" />
          {product.featured ? <span className="absolute start-3 top-3 rounded-full border border-[var(--border-gold)] bg-black/70 px-3 py-1 text-xs text-[var(--gold-soft)]">{t.signature}</span> : null}
          <span className="absolute end-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white/80">{displayCategory(product, language)}</span>
        </button>
      ) : null}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><h2 className="text-lg font-semibold sm:text-xl">{displayName(product, language)}</h2>{language === "ar" ? <p className="mt-1 truncate text-xs text-[var(--muted)]">{product.name}</p> : null}</div>
          <div className="shrink-0 text-end"><small className="block text-[0.65rem] text-[var(--muted)]">{t.from}</small><strong className="whitespace-nowrap text-[var(--gold-soft)]">{formatOmr(product.price, language)}</strong></div>
        </div>
        {showDescriptions ? <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{displayDescription(product, language)}</p> : null}
        {tags.length ? <div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-[0.65rem] text-[var(--muted)]">{tag}</span>)}</div> : null}
        <button type="button" onClick={() => onSelect(product)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-gold)] bg-[var(--gold)]/10 px-4 py-3 text-sm font-semibold text-[var(--gold-soft)] transition hover:bg-[var(--gold)] hover:text-black">{t.add}<ChevronDown className="h-4 w-4" /></button>
      </div>
    </article>
  );
}
