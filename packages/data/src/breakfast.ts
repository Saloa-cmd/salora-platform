export type BreakfastGroupKey = "platters" | "sandwiches" | "juices" | "tea";

export interface BreakfastAddonDefinition {
  name: string;
  price: number;
}

export interface BreakfastMenuItemDefinition {
  slug: string;
  group: BreakfastGroupKey;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  asset: string;
  featured?: boolean;
  addons?: BreakfastAddonDefinition[];
}

export const breakfastCategory = {
  slug: "breakfast",
  nameAr: "الإفطار",
  nameEn: "Breakfast",
  descriptionAr: "ريوق سالورا الصباحي: أطباق من ثلاث مطابخ، سندويشات سريعة، عصائر طازجة وشاي.",
  descriptionEn: "SALORA morning breakfast: three culinary traditions, quick sandwiches, fresh juices and tea.",
  sortOrder: 5
} as const;

export const breakfastService = {
  status: "AVAILABLE",
  timeZone: "Asia/Muscat",
  dailyStart: "08:00",
  dailyEnd: "12:00",
  availabilityAr: "متاح الآن",
  availabilityEn: "Available now",
  hoursAr: "يوميًا · 8 صباحًا — 12 ظهرًا",
  hoursEn: "Daily · 8 AM — 12 PM"
} as const;

export const breakfastGroups = [
  { key: "platters", nameAr: "أطباق الإفطار", nameEn: "Breakfast platters", count: 3 },
  { key: "sandwiches", nameAr: "السندويشات", nameEn: "Sandwiches", count: 6 },
  { key: "juices", nameAr: "العصائر الطازجة", nameEn: "Fresh juices", count: 5 },
  { key: "tea", nameAr: "أنواع الشاي", nameEn: "Tea selection", count: 8 }
] as const;

const extraEgg = { name: "بيضة إضافية | Extra egg", price: 0.3 };
const extraCheese = { name: "جبن إضافي | Extra cheese", price: 0.2 };
const extraBread = { name: "خبز إضافي | Extra bread", price: 0.2 };
const omanChips = { name: "شيبس عُمان | Oman Chips", price: 0.2 };
const freshMint = { name: "نعناع طازج | Fresh mint", price: 0.1 };

export const breakfastMenu: readonly BreakfastMenuItemDefinition[] = [
  {
    slug: "english-breakfast",
    group: "platters",
    nameAr: "الفطور الإنجليزي",
    nameEn: "English Breakfast",
    descriptionAr: "نقانق دجاج حلال، مرتديلا ديك رومي، فاصوليا مطهية، بيض وخبز توست.",
    descriptionEn: "Halal chicken sausages, turkey mortadella, baked beans, eggs and toast.",
    price: 3.9,
    asset: "/products/breakfast/english-breakfast.webp",
    featured: true,
    addons: [extraEgg, extraCheese, { name: "خبز توست إضافي | Extra toast", price: 0.2 }]
  },
  {
    slug: "arabic-breakfast",
    group: "platters",
    nameAr: "الفطور العربي",
    nameEn: "Arabic Breakfast",
    descriptionAr: "شكشوكة، مربى، حمص بالطحينة مع الفلافل، فول، مقبلات وقشطة.",
    descriptionEn: "Shakshuka, jam, hummus with falafel, ful medames, mezze and cream.",
    price: 3.5,
    asset: "/products/breakfast/arabic-breakfast.webp",
    featured: true,
    addons: [
      { name: "فلافل إضافية | Extra falafel", price: 0.3 },
      { name: "حمص إضافي | Extra hummus", price: 0.35 },
      { name: "خبز عربي إضافي | Extra Arabic bread", price: 0.2 }
    ]
  },
  {
    slug: "iranian-breakfast",
    group: "platters",
    nameAr: "الفطور الإيراني",
    nameEn: "Iranian Breakfast",
    descriptionAr: "أومليت، مربى، حلاوة، عسل، مكسرات، جبن، قشطة ومقبلات.",
    descriptionEn: "Persian omelette, jam, halva, honey, nuts, cheese, cream and mezze.",
    price: 3.7,
    asset: "/products/breakfast/iranian-breakfast.webp",
    featured: true,
    addons: [extraCheese, { name: "عسل إضافي | Extra honey", price: 0.25 }, extraBread]
  },
  {
    slug: "bandari-sausage-sandwich",
    group: "sandwiches",
    nameAr: "سوسيس بندري",
    nameEn: "Bandari Sausage Sandwich",
    descriptionAr: "سوسيس دجاج حلال مع صلصة بندري متبلة بالبصل والطماطم.",
    descriptionEn: "Halal chicken sausage with a spiced Bandari tomato and onion sauce.",
    price: 1.3,
    asset: "/products/breakfast/bandari-sausage-sandwich.webp",
    addons: [extraCheese, omanChips]
  },
  {
    slug: "bulgarian-sausage-sandwich",
    group: "sandwiches",
    nameAr: "سوسيس بلغاري",
    nameEn: "Bulgarian Sausage Sandwich",
    descriptionAr: "سوسيس دجاج حلال مشوي مع الفلفل الملون داخل خبز محمص.",
    descriptionEn: "Grilled halal chicken sausage with mixed peppers in toasted bread.",
    price: 1.4,
    asset: "/products/breakfast/bulgarian-sausage-sandwich.webp",
    addons: [extraCheese, omanChips]
  },
  {
    slug: "turkey-jambon-sandwich",
    group: "sandwiches",
    nameAr: "جامبون ديك رومي",
    nameEn: "Turkey Jambon Sandwich",
    descriptionAr: "شرائح جامبون ديك رومي حلال داخل خبز طازج محمص.",
    descriptionEn: "Halal turkey jambon slices in freshly toasted bread.",
    price: 1.3,
    asset: "/products/breakfast/turkey-jambon-sandwich.webp",
    addons: [extraCheese, omanChips]
  },
  {
    slug: "egg-sandwich",
    group: "sandwiches",
    nameAr: "ساندويش بيض",
    nameEn: "Egg Sandwich",
    descriptionAr: "بيض طازج محضّر صباحًا داخل خبز محمص.",
    descriptionEn: "Fresh morning eggs in toasted bread.",
    price: 0.8,
    asset: "/products/breakfast/egg-sandwich.webp",
    addons: [extraCheese, omanChips]
  },
  {
    slug: "egg-cheese-sandwich",
    group: "sandwiches",
    nameAr: "ساندويش جبن وبيض",
    nameEn: "Egg & Cheese Sandwich",
    descriptionAr: "بيض طازج وجبن ذائب داخل خبز محمص.",
    descriptionEn: "Fresh eggs and melted cheese in toasted bread.",
    price: 1,
    asset: "/products/breakfast/egg-cheese-sandwich.webp",
    addons: [omanChips, extraEgg]
  },
  {
    slug: "egg-cheese-oman-chips-sandwich",
    group: "sandwiches",
    nameAr: "ساندويش جبن وبيض وشيبس عُمان",
    nameEn: "Egg, Cheese & Oman Chips Sandwich",
    descriptionAr: "بيض وجبن ذائب مع قرمشة شيبس عُمان داخل خبز محمص.",
    descriptionEn: "Egg, melted cheese and the signature crunch of Oman Chips in toasted bread.",
    price: 1.2,
    asset: "/products/breakfast/egg-cheese-oman-chips-sandwich.webp",
    addons: [extraEgg, extraCheese]
  },
  {
    slug: "breakfast-fresh-orange-juice",
    group: "juices",
    nameAr: "عصير برتقال طازج",
    nameEn: "Fresh Orange Juice",
    descriptionAr: "برتقال طازج معصور عند الطلب.",
    descriptionEn: "Fresh orange juice, pressed to order.",
    price: 1.4,
    asset: "/products/breakfast/fresh-orange-juice.webp"
  },
  {
    slug: "breakfast-fresh-mango-juice",
    group: "juices",
    nameAr: "عصير مانجو طازج",
    nameEn: "Fresh Mango Juice",
    descriptionAr: "مانجو طازج بقوام غني ومنعش.",
    descriptionEn: "Fresh mango with a rich, refreshing texture.",
    price: 1.5,
    asset: "/products/breakfast/fresh-mango-juice.webp"
  },
  {
    slug: "breakfast-lemonade",
    group: "juices",
    nameAr: "ليمونادة",
    nameEn: "Lemonade",
    descriptionAr: "ليمونادة طازجة متوازنة الحلاوة والحموضة.",
    descriptionEn: "Fresh lemonade with a balanced sweet-tart finish.",
    price: 1.2,
    asset: "/products/breakfast/lemonade.webp",
    addons: [freshMint]
  },
  {
    slug: "breakfast-sweet-sour",
    group: "juices",
    nameAr: "حامض حلو",
    nameEn: "Sweet & Sour",
    descriptionAr: "مزيج فواكه منعش بطبقات حلوة وحامضة.",
    descriptionEn: "A refreshing layered fruit blend with sweet and tart notes.",
    price: 1.4,
    asset: "/products/breakfast/sweet-sour.webp",
    addons: [freshMint]
  },
  {
    slug: "breakfast-mojito",
    group: "juices",
    nameAr: "موهيتو",
    nameEn: "Virgin Mojito",
    descriptionAr: "ليمون ونعناع طازجان مع صودا منعشة، دون كحول.",
    descriptionEn: "Fresh lime and mint with sparkling soda, alcohol-free.",
    price: 1.5,
    asset: "/products/breakfast/mojito.webp"
  },
  {
    slug: "breakfast-black-tea",
    group: "tea",
    nameAr: "شاي أسود",
    nameEn: "Black Tea",
    descriptionAr: "شاي أسود كلاسيكي غني وواضح النكهة.",
    descriptionEn: "Classic black tea with a clear, full-bodied finish.",
    price: 0.6,
    asset: "/products/breakfast/black-tea.webp",
    addons: [freshMint]
  },
  {
    slug: "breakfast-green-mint-tea",
    group: "tea",
    nameAr: "شاي أخضر بالنعناع",
    nameEn: "Green Tea with Mint",
    descriptionAr: "شاي أخضر خفيف مع أوراق نعناع طازجة.",
    descriptionEn: "Light green tea with fresh mint leaves.",
    price: 0.8,
    asset: "/products/breakfast/green-mint-tea.webp"
  },
  {
    slug: "breakfast-karak-tea",
    group: "tea",
    nameAr: "شاي كرك",
    nameEn: "Karak Tea",
    descriptionAr: "شاي كرك كريمي بالتوابل الدافئة.",
    descriptionEn: "Creamy karak tea with warm spices.",
    price: 0.7,
    asset: "/products/breakfast/karak-tea.webp"
  },
  {
    slug: "breakfast-moroccan-tea",
    group: "tea",
    nameAr: "شاي مغربي",
    nameEn: "Moroccan Tea",
    descriptionAr: "شاي أخضر على الطريقة المغربية مع نعناع طازج.",
    descriptionEn: "Moroccan-style green tea with fresh mint.",
    price: 1,
    asset: "/products/breakfast/moroccan-tea.webp"
  },
  {
    slug: "breakfast-hibiscus-tea",
    group: "tea",
    nameAr: "كركديه",
    nameEn: "Hibiscus Tea",
    descriptionAr: "منقوع كركديه عطري بلون ياقوتي.",
    descriptionEn: "Fragrant hibiscus infusion with a ruby-red color.",
    price: 0.9,
    asset: "/products/breakfast/hibiscus-tea.webp"
  },
  {
    slug: "breakfast-chamomile-tea",
    group: "tea",
    nameAr: "بابونج",
    nameEn: "Chamomile Tea",
    descriptionAr: "منقوع بابونج هادئ وخفيف.",
    descriptionEn: "A calm, delicate chamomile infusion.",
    price: 0.9,
    asset: "/products/breakfast/chamomile-tea.webp"
  },
  {
    slug: "breakfast-fruit-tea",
    group: "tea",
    nameAr: "شاي بالفواكه",
    nameEn: "Fruit Tea",
    descriptionAr: "شاي عطري بنفحات الفواكه الموسمية.",
    descriptionEn: "Aromatic tea with notes of seasonal fruit.",
    price: 1,
    asset: "/products/breakfast/fruit-tea.webp"
  },
  {
    slug: "breakfast-saffron-tea",
    group: "tea",
    nameAr: "شاي بالزعفران",
    nameEn: "Saffron Tea",
    descriptionAr: "شاي ذهبي مع زعفران عطري فاخر.",
    descriptionEn: "Golden tea infused with fragrant premium saffron.",
    price: 1.2,
    asset: "/products/breakfast/saffron-tea.webp"
  }
] as const;

export const breakfastMediaBySlug = Object.fromEntries(
  breakfastMenu.map((item) => [item.slug, item.asset])
) as Readonly<Record<string, string>>;

export function isBreakfastProduct(tags: readonly string[] | undefined): boolean {
  return Boolean(tags?.includes("breakfast"));
}

export function isBreakfastProductInGroup(
  tags: readonly string[] | undefined,
  group: BreakfastGroupKey | null | undefined
): boolean {
  return !group || Boolean(tags?.includes(`breakfast-${group}`));
}
