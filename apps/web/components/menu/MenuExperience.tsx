"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import type { Product } from "@salora/types";

type Language = "ar" | "en";
type ServiceMode = "counter" | "car" | "dine-in" | "gift";
type ProductOptions = { size: "regular" | "large"; milk: "regular" | "oat" | "almond"; sugar: "none" | "less" | "regular"; ice: "none" | "light" | "regular" };
type CartLine = { key: string; product: Product; quantity: number; options: ProductOptions; unitPrice: number };

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
    standard: "كما هو من سالورا"
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
    standard: "SALORA standard"
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

const defaultOptions: ProductOptions = { size: "regular", milk: "regular", sugar: "regular", ice: "regular" };

function optionLabel(language: Language, value: string) {
  const labels = copy[language] as Record<string, string>;
  return labels[value] ?? value;
}

function displayName(product: Product, language: Language) {
  return language === "ar" ? arabicNames[product.id] ?? product.name : product.name;
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

export function MenuExperience({ initialProducts, menuSource, menuStale, whatsappNumber }: { initialProducts: Product[]; menuSource: "database" | "fallback"; menuStale: boolean; whatsappNumber: string }) {
  const [language, setLanguage] = useState<Language>("ar");
  const [serviceMode, setServiceMode] = useState<ServiceMode>("counter");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<ProductOptions>(defaultOptions);
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
      const searchMatch = !query || `${product.name} ${arabicNames[product.id] ?? ""} ${product.category} ${product.tags.join(" ")}`.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [category, initialProducts, search]);
  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setOptions(defaultOptions);
  }

  function addSelectedProduct() {
    if (!selectedProduct) return;
    const sizeDelta = options.size === "large" ? 0.3 : 0;
    const milkDelta = options.milk === "regular" ? 0 : 0.25;
    const unitPrice = Number((selectedProduct.price + sizeDelta + milkDelta).toFixed(3));
    const key = `${selectedProduct.id}:${Object.values(options).join(":")}`;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) return current.map((line) => line.key === key ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { key, product: selectedProduct, quantity: 1, options, unitPrice }];
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
      const detail = supportsDrinkOptions(line.product)
        ? [line.options.size, line.options.milk, line.options.sugar, line.options.ice].map((value) => optionLabel(language, value)).join(" · ")
        : t.standard;
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
          items: cart.map((line) => ({ productName: line.product.name, quantity: line.quantity, unitPrice: line.unitPrice })),
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

  return (
    <main dir={t.direction} className="min-h-screen bg-[#050505] text-[var(--cream)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="SALORA home">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border-gold)] bg-[var(--gold)]/10"><Coffee className="h-5 w-5 text-[var(--gold-soft)]" /></span>
            <span><strong className="block tracking-[0.24em]">SALORA</strong><small className="text-[var(--muted)]">Taste the Harmony</small></span>
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLanguage((value) => value === "ar" ? "en" : "ar")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold">
              <Languages className="h-4 w-4" /> {language === "ar" ? "English" : "العربية"}
            </button>
            <button type="button" onClick={() => setCartOpen(true)} className="relative inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black">
              <ShoppingBag className="h-4 w-4" /> {t.cart}
              {itemCount ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[0.65rem] text-white">{itemCount}</span> : null}
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10 px-4 py-14 sm:px-6 lg:py-20">
        <div className="hero-depth" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gold-soft)]"><Sparkles className="h-4 w-4" />{t.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">{t.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">{t.intro}</p>
            <span className={`mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${menuStale ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>
              <span className="h-2 w-2 rounded-full bg-current" /> {menuSource === "database" ? t.live : t.fallback}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceModes.map(({ id, ar, en, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={serviceMode === id} onClick={() => setServiceMode(id)} className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition ${serviceMode === id ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "border-white/10 bg-white/[0.04] text-[var(--muted)] hover:border-white/20"}`}>
                <Icon className="h-5 w-5 shrink-0" /><span className="text-sm font-semibold">{language === "ar" ? ar : en}</span>{serviceMode === id ? <Check className="ms-auto h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 lg:max-w-xl">
            <Search className="h-5 w-5 text-[var(--muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${category === item ? "border-[var(--gold)] bg-[var(--gold)] text-black" : "border-white/10 bg-white/[0.04] text-[var(--muted)]"}`}>{item === "All" ? t.all : item}</button>)}
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-[var(--border-gold)]">
              <div className={`relative aspect-[16/10] bg-gradient-to-br ${productAccent(product)}`}>
                <div className="absolute inset-0 grid place-items-center"><Coffee className="h-16 w-16 text-white/15" strokeWidth={1} /></div>
                {product.featured ? <span className="absolute start-4 top-4 rounded-full border border-[var(--border-gold)] bg-black/60 px-3 py-1 text-xs text-[var(--gold-soft)]">Signature</span> : null}
                <span className="absolute end-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white/70">{product.category}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{displayName(product, language)}</h2>{language === "ar" ? <p className="mt-1 text-xs text-[var(--muted)]">{product.name}</p> : null}</div><strong className="whitespace-nowrap text-[var(--gold-soft)]">{formatOmr(product.price, language)}</strong></div>
                <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{product.description || product.story}</p>
                <button type="button" onClick={() => openProduct(product)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-gold)] bg-[var(--gold)]/10 px-4 py-3 text-sm font-semibold text-[var(--gold-soft)] transition hover:bg-[var(--gold)] hover:text-black">{t.add}<ChevronDown className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 grid items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t.customize}>
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111] p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-[var(--gold-soft)]">{t.customize}</p><h2 className="mt-2 text-2xl font-semibold">{displayName(selectedProduct, language)}</h2></div><button type="button" onClick={() => setSelectedProduct(null)} className="rounded-full border border-white/10 p-2"><X className="h-5 w-5" /></button></div>
            {supportsDrinkOptions(selectedProduct) ? (
              <div className="mt-7 grid gap-6">
                <OptionGroup label={t.size} values={["regular", "large"]} selected={options.size} language={language} onChange={(value) => setOptions((current) => ({ ...current, size: value as ProductOptions["size"] }))} />
                <OptionGroup label={t.milk} values={["regular", "oat", "almond"]} selected={options.milk} language={language} onChange={(value) => setOptions((current) => ({ ...current, milk: value as ProductOptions["milk"] }))} />
                <OptionGroup label={t.sugar} values={["none", "less", "regular"]} selected={options.sugar} language={language} onChange={(value) => setOptions((current) => ({ ...current, sugar: value as ProductOptions["sugar"] }))} />
                <OptionGroup label={t.ice} values={["none", "light", "regular"]} selected={options.ice} language={language} onChange={(value) => setOptions((current) => ({ ...current, ice: value as ProductOptions["ice"] }))} />
              </div>
            ) : <p className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--muted)]">{t.standard}</p>}
            <button type="button" onClick={addSelectedProduct} className="mt-7 flex w-full items-center justify-between rounded-2xl bg-[var(--gold)] px-5 py-4 font-semibold text-black"><span>{t.confirm}</span><span>{formatOmr(selectedProduct.price + (supportsDrinkOptions(selectedProduct) && options.size === "large" ? 0.3 : 0) + (supportsDrinkOptions(selectedProduct) && options.milk !== "regular" ? 0.25 : 0), language)}</span></button>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t.cart}>
          <aside className={`absolute inset-y-0 w-full max-w-md overflow-y-auto border-white/10 bg-[#0d0d0d] p-5 shadow-2xl ${language === "ar" ? "left-0 border-r" : "right-0 border-l"}`}>
            <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">{t.cart}</h2><button type="button" onClick={() => setCartOpen(false)} className="rounded-full border border-white/10 p-2"><X className="h-5 w-5" /></button></div>
            {cart.length ? <div className="mt-6 grid gap-4">{cart.map((line) => <div key={line.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{displayName(line.product, language)}</h3><p className="mt-1 text-xs text-[var(--muted)]">{supportsDrinkOptions(line.product) ? Object.values(line.options).map((value) => optionLabel(language, value)).join(" · ") : t.standard}</p></div><span className="text-sm text-[var(--gold-soft)]">{formatOmr(line.unitPrice * line.quantity, language)}</span></div><div className="mt-4 flex items-center gap-3"><button type="button" onClick={() => changeQuantity(line.key, -1)} className="rounded-full border border-white/10 p-1"><Minus className="h-4 w-4" /></button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line.key, 1)} className="rounded-full border border-white/10 p-1"><Plus className="h-4 w-4" /></button></div></div>)}</div> : <p className="mt-10 text-center text-sm text-[var(--muted)]">{t.empty}</p>}
            {cart.length ? <div className="mt-7 grid gap-3 border-t border-white/10 pt-6"><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.customerName} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t.phone} inputMode="tel" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" />{serviceMode === "car" ? <input value={carDetails} onChange={(event) => setCarDetails(event.target.value)} placeholder={t.carDetails} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /> : null}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.notes} rows={3} className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" /><div className="flex items-center justify-between py-2"><span className="text-[var(--muted)]">{t.subtotal}</span><strong className="text-xl text-[var(--gold-soft)]">{formatOmr(subtotal, language)}</strong></div>{notice ? <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-[var(--muted)]">{notice}</p> : null}<button type="button" disabled={submitting} onClick={checkout} className="rounded-2xl bg-[var(--gold)] px-5 py-4 font-semibold text-black disabled:opacity-50">{submitting ? "…" : t.checkout}</button></div> : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function OptionGroup({ label, values, selected, language, onChange }: { label: string; values: string[]; selected: string; language: Language; onChange: (value: string) => void }) {
  return <fieldset><legend className="mb-3 text-sm font-semibold text-[var(--muted)]">{label}</legend><div className="grid grid-cols-3 gap-2">{values.map((value) => <button key={value} type="button" aria-pressed={selected === value} onClick={() => onChange(value)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${selected === value ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "border-white/10 text-[var(--muted)]"}`}>{optionLabel(language, value)}</button>)}</div></fieldset>;
}
