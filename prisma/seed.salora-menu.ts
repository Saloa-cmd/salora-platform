import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("SALORA catalog seed requires DIRECT_URL or DATABASE_URL.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const BRAND = "SALORA";

type MenuRow = readonly [category: string, slug: string, nameAr: string, nameEn: string, price: number | null, signature?: boolean];

const categories = [
  ["hot-coffee", "القهوة الساخنة", "Hot Coffee"],
  ["iced-coffee", "القهوة الباردة", "Iced Coffee"],
  ["specialty-coffee", "القهوة المختصة", "Specialty Coffee"],
  ["hot-drinks", "المشروبات الساخنة", "Hot Drinks"],
  ["matcha", "قائمة الماتشا", "Matcha Menu"],
  ["iced-tea", "الشاي المثلج", "Iced Tea"],
  ["fresh-juices", "العصائر الطازجة", "Fresh Juices"],
  ["fruit-cocktails", "كوكتيلات الفواكه", "Fruit Cocktails"],
  ["mocktails", "الكوكتيلات الباردة", "Soft Cocktails"],
  ["milkshakes", "الميلك شيك", "Milkshakes"],
  ["frappes", "الفرابيه", "Frappés"],
  ["smoothies", "السموذي", "Smoothies"],
  ["desserts", "الحلويات", "Desserts"],
  ["healthy-wellness", "قائمة الصحة", "SALORA Wellness"],
  ["kids-drinks", "الأطفال", "SALORA Kids"],
  ["salora-signature", "قهوة سالورا المميزة", "SALORA Signature Coffee"]
] as const;

const menu: MenuRow[] = [
  ["hot-coffee", "espresso", "إسبريسو", "Espresso", 0.6],
  ["hot-coffee", "espresso-cream", "إسبريسو بالكريمة", "Espresso Cream", 1.1],
  ["hot-coffee", "nutella-espresso", "إسبريسو نوتيلا", "Nutella Espresso", 1.2],
  ["hot-coffee", "americano", "أمريكانو", "Americano", 1.0],
  ["hot-coffee", "cappuccino", "كابتشينو", "Cappuccino", 1.1],
  ["hot-coffee", "cortado", "كورتادو", "Cortado", 1.1],
  ["hot-coffee", "macchiato", "ماكياتو", "Macchiato", 0.9],
  ["hot-coffee", "caramel-macchiato", "كاراميل ماكياتو", "Caramel Macchiato", 1.2],
  ["hot-coffee", "flat-white", "فلات وايت", "Flat White", 1.2],
  ["hot-coffee", "latte", "لاتيه", "Latte", 1.1],
  ["hot-coffee", "spanish-latte", "سبانش لاتيه", "Spanish Latte", 1.4],
  ["hot-coffee", "caramel-latte", "لاتيه كاراميل", "Caramel Latte", 1.5],
  ["hot-coffee", "hazelnut-latte", "لاتيه بندق", "Hazelnut Latte", 1.5],
  ["hot-coffee", "pistachio-latte", "لاتيه فستق", "Pistachio Latte", 1.6],
  ["hot-coffee", "rose-latte", "لاتيه الورد", "Rose Latte", 1.4],
  ["hot-coffee", "mocha", "موكا", "Mocha", 1.4],
  ["hot-coffee", "white-mocha", "وايت موكا", "White Mocha", 1.5],
  ["iced-coffee", "iced-latte", "آيس لاتيه", "Iced Latte", 1.2],
  ["iced-coffee", "iced-spanish-latte", "آيس سبانش لاتيه", "Iced Spanish Latte", 1.5],
  ["iced-coffee", "iced-caramel-latte", "آيس كاراميل لاتيه", "Iced Caramel Latte", 1.5],
  ["iced-coffee", "iced-hazelnut-latte", "آيس لاتيه بندق", "Iced Hazelnut Latte", 1.5],
  ["iced-coffee", "iced-pistachio-latte", "آيس لاتيه فستق", "Iced Pistachio Latte", 1.6],
  ["iced-coffee", "iced-strawberry-latte", "آيس لاتيه فراولة", "Iced Strawberry Latte", 1.5],
  ["iced-coffee", "iced-rose-latte", "آيس لاتيه الورد", "Iced Rose Latte", 1.4],
  ["iced-coffee", "iced-mocha", "آيس موكا", "Iced Mocha", 1.4],
  ["iced-coffee", "iced-mocha-frappe", "آيس موكا فرابيه", "Iced Mocha Frappé", 1.8],
  ["iced-coffee", "iced-white-mocha", "آيس وايت موكا", "Iced White Mocha", 1.5],
  ["iced-coffee", "iced-white-mocha-frappe", "آيس وايت موكا فرابيه", "Iced White Mocha Frappé", 1.8],
  ["iced-coffee", "iced-americano", "آيس أمريكانو", "Iced Americano", 1.1],
  ["iced-coffee", "frappuccino", "فرابتشينو", "Frappuccino", 1.8],
  ["salora-signature", "salora-latte", "لاتيه سالورا ساخن أو بارد", "SALORA Latte — Hot or Iced", null, true],
  ["salora-signature", "salora-cappuccino", "كابتشينو سالورا", "SALORA Cappuccino", null, true],
  ["salora-signature", "pistachio-spanish-latte", "سبانش فستق", "Pistachio Spanish Latte", null, true],
  ["salora-signature", "peanut-butter-latte", "لاتيه زبدة الفول السوداني", "Peanut Butter Latte", null, true],
  ["salora-signature", "pistachio-espresso", "إسبريسو فستق", "Pistachio Espresso", null, true],
  ["specialty-coffee", "v60", "في 60", "V60", 2.3],
  ["specialty-coffee", "cold-brew", "كولد برو", "Cold Brew", 1.8],
  ["specialty-coffee", "french-press", "فرنش برس", "French Press", 2.5],
  ["fresh-juices", "mango-juice", "مانجو", "Mango", 1.3],
  ["fresh-juices", "mango-passion-fruit", "مانجو باشن فروت", "Mango Passion Fruit", 1.6],
  ["fresh-juices", "strawberry-juice", "فراولة", "Strawberry", 1.4],
  ["fresh-juices", "banana-juice", "موز", "Banana", 1.2],
  ["fresh-juices", "pomegranate-juice", "رمان", "Pomegranate", 1.5],
  ["fresh-juices", "guava-juice", "جوافة", "Guava", 1.5],
  ["fresh-juices", "orange-juice", "برتقال", "Orange", 1.2],
  ["fresh-juices", "pineapple-juice", "أناناس", "Pineapple", 1.5],
  ["fresh-juices", "avocado-juice", "أفوكادو", "Avocado", 1.6],
  ["fresh-juices", "watermelon-juice", "بطيخ", "Watermelon", 1.5],
  ["fresh-juices", "lemon-mint", "ليمون بالنعناع", "Lemon Mint", 1.1],
  ["fruit-cocktails", "florida", "فلوريدا", "Florida", 1.7],
  ["fruit-cocktails", "havana", "هافانا", "Havana", 1.7],
  ["fruit-cocktails", "dragon", "دراغون", "Dragon", 1.9],
  ["fruit-cocktails", "red-tornado", "ريد تورنادو", "Red Tornado", 1.8],
  ["fruit-cocktails", "four-seasons", "فور سيزونز", "Four Seasons", 1.7],
  ["fruit-cocktails", "hawaii", "هاواي", "Hawaii", 1.8],
  ["mocktails", "sunshine", "صن شاين", "Sunshine", 1.4],
  ["mocktails", "sunrise", "صن رايز", "Sunrise", 1.6],
  ["mocktails", "blue-sky", "بلو سكاي", "Blue Sky", 1.3],
  ["mocktails", "blue-ocean", "بلو أوشن", "Blue Ocean", 1.6],
  ["mocktails", "classic-virgin-mojito", "موهيتو كلاسيك", "Classic Virgin Mojito", 1.5],
  ["mocktails", "brazilian-lemonade", "ليمونادة برازيلية", "Brazilian Lemonade", null],
  ["mocktails", "pina-colada", "بينا كولادا", "Piña Colada", null],
  ["mocktails", "bahr", "بحر", "Bahr", 2.0, true],
  ["mocktails", "khayal", "خيال", "Khayal", 2.0, true],
  ["milkshakes", "vanilla-milkshake", "ميلك شيك فانيليا", "Vanilla Milkshake", 1.5],
  ["milkshakes", "chocolate-milkshake", "ميلك شيك شوكولاتة", "Chocolate Milkshake", 1.5],
  ["milkshakes", "caramel-milkshake", "ميلك شيك كاراميل", "Caramel Milkshake", 1.6],
  ["milkshakes", "snickers-milkshake", "ميلك شيك سنيكرز", "Snickers Milkshake", 2.0],
  ["milkshakes", "oreo-milkshake", "ميلك شيك أوريو", "Oreo Milkshake", 1.7],
  ["milkshakes", "pistachio-milkshake", "ميلك شيك فستق", "Pistachio Milkshake", 2.0],
  ["milkshakes", "strawberry-milkshake", "ميلك شيك فراولة", "Strawberry Milkshake", null],
  ["milkshakes", "awar-qalb", "عوار قلب", "Awar Qalb", 2.0, true],
  ["frappes", "raspberry-frappe", "فرابيه توت العليق", "Raspberry Frappé", 1.9],
  ["frappes", "strawberry-frappe", "فرابيه فراولة", "Strawberry Frappé", 1.8],
  ["frappes", "mixed-berry-frappe", "فرابيه توت مشكّل", "Mixed Berry Frappé", 2.0],
  ["frappes", "watermelon-frappe", "فرابيه بطيخ", "Watermelon Frappé", 1.7],
  ["matcha", "coconut-matcha-latte", "ماتشا لاتيه بجوز الهند — ساخن أو بارد", "Coconut Matcha Latte — Hot or Iced", 1.7],
  ["matcha", "mango-matcha-frappe", "ماتشا مانجو فرابيه", "Mango Matcha Frappé", 2.0],
  ["matcha", "strawberry-matcha-frappe", "ماتشا فراولة فرابيه", "Strawberry Matcha Frappé", 1.9],
  ["matcha", "raspberry-matcha-frappe", "ماتشا توت العليق فرابيه", "Raspberry Matcha Frappé", 2.0],
  ["smoothies", "mango-passion-smoothie", "سموذي مانجو وباشن فروت", "Mango Passion Smoothie", 1.5],
  ["smoothies", "blueberry-smoothie", "سموذي توت أزرق", "Blueberry Smoothie", 1.6],
  ["smoothies", "raspberry-smoothie", "سموذي توت العليق", "Raspberry Smoothie", 1.6],
  ["smoothies", "strawberry-smoothie", "سموذي فراولة", "Strawberry Smoothie", 1.5],
  ["smoothies", "lemon-mint-smoothie", "سموذي ليمون ونعناع", "Lemon Mint Smoothie", 1.4],
  ["healthy-wellness", "protein-shake", "مخفوق البروتين", "Protein Shake", null],
  ["healthy-wellness", "collagen-drink", "مشروب الكولاجين", "Collagen Drink", 2.0],
  ["healthy-wellness", "healthy-pistachio-milkshake", "ميلك شيك صحي بالفستق", "Healthy Pistachio Milkshake", 2.2],
  ["healthy-wellness", "healthy-chocolate-milkshake", "ميلك شيك صحي بالشوكولاتة", "Healthy Chocolate Milkshake", 1.8],
  ["healthy-wellness", "keto-milkshake", "ميلك شيك كيتو دايت", "Keto Diet Milkshake", 2.2],
  ["healthy-wellness", "green-detox-stevia", "ديتوكس أخضر محلى بالستيفيا", "Green Detox with Stevia", 1.5],
  ["healthy-wellness", "lemon-mint-detox", "ديتوكس الليمون والنعناع بالستيفيا", "Lemon Mint Detox with Stevia", 1.4],
  ["healthy-wellness", "berry-detox", "ديتوكس التوت بالستيفيا", "Berry Detox with Stevia", null],
  ["healthy-wellness", "protein-bar", "بروتين بار", "Protein Bar", 1.5],
  ["kids-drinks", "babyccino", "بيبي تشينو — بدون قهوة", "Babyccino — Coffee-Free", 0.7],
  ["kids-drinks", "strawberry-vanilla-milk", "حليب الفراولة والفانيليا", "Strawberry Vanilla Milk", 1.1],
  ["kids-drinks", "nesquik-chocolate-milk", "حليب شوكولاتة نسكويك", "Nesquik Chocolate Milk", 1.0],
  ["kids-drinks", "nutella-milk", "حليب النوتيلا", "Nutella Milk", 1.2],
  ["hot-drinks", "turkish-coffee", "قهوة تركية", "Turkish Coffee", 0.8],
  ["hot-drinks", "red-tea", "شاي أحمر", "Red Tea", 0.4],
  ["hot-drinks", "herbal-tea", "شاي أعشاب", "Herbal Tea", 0.6],
  ["hot-drinks", "hot-apple-cider", "سيدر تفاح ساخن", "Hot Apple Cider", 1.2],
  ["hot-drinks", "hot-chocolate", "شوكولاتة ساخنة", "Hot Chocolate", 1.3],
  ["hot-drinks", "arabic-coffee", "قهوة عربية", "Arabic Coffee", 0.8],
  ["iced-tea", "pineapple-iced-tea", "شاي مثلج بالأناناس", "Pineapple Iced Tea", 1.6],
  ["iced-tea", "peach-iced-tea", "شاي مثلج بالخوخ", "Peach Iced Tea", 1.5],
  ["iced-tea", "strawberry-iced-tea", "شاي مثلج بالفراولة", "Strawberry Iced Tea", 1.4],
  ["iced-tea", "passion-fruit-iced-tea", "شاي مثلج بالباشن فروت", "Passion Fruit Iced Tea", 1.4],
  ["iced-tea", "hibiscus-iced-tea", "شاي كركديه مثلج", "Hibiscus Iced Tea", 1.4],
  ["desserts", "san-sebastian-cheesecake", "سان سباستيان", "San Sebastian Cheesecake", 2.0],
  ["desserts", "american-cheesecake", "تشيزكيك أمريكي", "American Cheesecake", 2.1],
  ["desserts", "tiramisu", "تيراميسو", "Tiramisu", 1.8],
  ["desserts", "red-velvet", "ريد فيلفت", "Red Velvet", 1.9],
  ["desserts", "chocolate-fudge-cake", "شوكولاتة فدج", "Chocolate Fudge Cake", 1.9],
  ["desserts", "brownie", "براوني", "Brownie", 1.7],
  ["desserts", "pistachio-cheesecake", "تشيزكيك الفستق", "Pistachio Cheesecake", 2.3],
  ["desserts", "dubai-cake", "كيكة دبي", "Dubai Cake", 2.3]
];

function imagePrompt(nameEn: string, categoryEn: string) {
  return `Photorealistic premium menu product photograph of ${nameEn}, accurate ingredients and serving style for ${categoryEn}. SALORA luxury coastal cafe identity, matte black stone surface, subtle warm gold accents, soft cinematic side lighting, elegant dark background, centered single product, realistic food styling, high detail, no people, no hands, no text, no logo, no watermark, square composition.`;
}

async function main() {
  const categoryIds = new Map<string, string>();
  const productIds = new Map<string, string>();
  for (const [index, [slug, nameAr, nameEn]] of categories.entries()) {
    const category = await prisma.productCategory.upsert({
      where: { slug },
      create: { brandKey: BRAND, slug, name: nameEn, nameAr, nameEn, sortOrder: (index + 1) * 10 },
      update: { brandKey: BRAND, name: nameEn, nameAr, nameEn, sortOrder: (index + 1) * 10 }
    });
    categoryIds.set(slug, category.id);
  }

  for (const [categorySlug, slug, nameAr, nameEn, price, signature = false] of menu) {
    const categoryId = categoryIds.get(categorySlug);
    if (!categoryId) throw new Error(`Missing category ${categorySlug}`);
    const status = price === null ? "DRAFT" : "ACTIVE";
    const descriptionAr = price === null ? "صنف جديد قيد مراجعة السعر والصورة قبل النشر." : `${nameAr} محضّر بعناية وفق معايير سالورا.`;
    const descriptionEn = price === null ? "New item pending price and image approval before publication." : `${nameEn}, carefully prepared to SALORA standards.`;
    const governanceTags = [
      categorySlug,
      ...(signature ? ["signature"] : []),
      ...(categorySlug === "healthy-wellness" ? ["healthy", "wellness"] : []),
      ...(categorySlug === "kids-drinks" ? ["kids", "kid-friendly"] : [])
    ];
    const product = await prisma.catalogProduct.upsert({
      where: { slug },
      create: { brandKey: BRAND, categoryId, slug, name: nameEn, nameAr, nameEn, description: descriptionEn, descriptionAr, descriptionEn, status, basePrice: price ?? 0, tags: governanceTags },
      update: { brandKey: BRAND, categoryId, name: nameEn, nameAr, nameEn, description: descriptionEn, descriptionAr, descriptionEn, status, basePrice: price ?? 0, tags: governanceTags }
    });
    productIds.set(slug, product.id);

    const existingPrompt = await prisma.productMediaDraft.findFirst({ where: { productId: product.id, source: "seed_catalog", archivedAt: null } });
    if (!existingPrompt) {
      await prisma.productMediaDraft.create({ data: { productId: product.id, source: "seed_catalog", prompt: imagePrompt(nameEn, categories.find(([key]) => key === categorySlug)?.[2] ?? categorySlug), altText: `${nameAr} — ${nameEn}`, isPrimaryCandidate: true, metadata: { brand: BRAND, reviewRequired: true, generatedAssetPending: true } } });
    }
  }


  const P22_ACTOR_ID = "00000000-0000-0000-0000-000000000022";
  const collectionDefinitions = [
    {
      key: "salora-menu",
      slug: "salora-menu",
      kind: "STANDARD",
      nameAr: "منيو سالورا",
      nameEn: "SALORA Menu",
      descriptionAr: "المصدر الموحد لجميع قنوات منيو سالورا.",
      descriptionEn: "The governed menu authority for every SALORA channel.",
      categorySlugs: categories.map(([slug]) => slug),
      sectionKey: null
    },
    {
      key: "salora-wellness",
      slug: "salora-wellness",
      kind: "WELLNESS",
      nameAr: "قائمة الصحة",
      nameEn: "SALORA Wellness",
      descriptionAr: "قائمة مستقلة؛ الادعاءات الغذائية لا تنشر قبل التحقق.",
      descriptionEn: "A separate wellness menu with food claims gated by verification.",
      categorySlugs: ["healthy-wellness"],
      sectionKey: "wellness"
    },
    {
      key: "salora-kids",
      slug: "salora-kids",
      kind: "KIDS",
      nameAr: "قائمة الأطفال",
      nameEn: "SALORA Kids",
      descriptionAr: "قائمة أطفال مستقلة مع مراجعة الحساسية والعمر.",
      descriptionEn: "A separate kids menu with allergen and age guidance review.",
      categorySlugs: ["kids-drinks"],
      sectionKey: "kids"
    }
  ] as const;

  for (const definition of collectionDefinitions) {
    const collection = await prisma.menuCollection.upsert({
      where: { brandKey_key: { brandKey: BRAND, key: definition.key } },
      create: {
        brandKey: BRAND,
        key: definition.key,
        slug: definition.slug,
        kind: definition.kind,
        status: "DRAFT",
        nameAr: definition.nameAr,
        nameEn: definition.nameEn,
        descriptionAr: definition.descriptionAr,
        descriptionEn: definition.descriptionEn,
        channels: ["WEB", "DIGITAL_MENU", "MOBILE"],
        createdBy: P22_ACTOR_ID,
        updatedBy: P22_ACTOR_ID
      },
      update: {
        slug: definition.slug,
        kind: definition.kind,
        nameAr: definition.nameAr,
        nameEn: definition.nameEn,
        descriptionAr: definition.descriptionAr,
        descriptionEn: definition.descriptionEn,
        channels: ["WEB", "DIGITAL_MENU", "MOBILE"],
        updatedBy: P22_ACTOR_ID
      }
    });

    const sectionIds = new Map<string, string>();
    const sectionCategories = definition.sectionKey
      ? definition.categorySlugs.map((slug) => {
          const category = categories.find(([candidate]) => candidate === slug);
          if (!category) throw new Error(`Missing P22 category ${slug}`);
          return [definition.sectionKey, category[1], category[2], 10] as const;
        })
      : definition.categorySlugs.map((slug, index) => {
          const category = categories.find(([candidate]) => candidate === slug);
          if (!category) throw new Error(`Missing P22 category ${slug}`);
          return [slug, category[1], category[2], (index + 1) * 10] as const;
        });

    for (const [sectionKey, nameAr, nameEn, sortOrder] of sectionCategories) {
      const section = await prisma.menuCollectionSection.upsert({
        where: { collectionId_key: { collectionId: collection.id, key: sectionKey } },
        create: {
          collectionId: collection.id,
          key: sectionKey,
          nameAr,
          nameEn,
          sortOrder,
          isActive: true,
          createdBy: P22_ACTOR_ID,
          updatedBy: P22_ACTOR_ID
        },
        update: {
          nameAr,
          nameEn,
          sortOrder,
          isActive: true,
          archivedAt: null,
          updatedBy: P22_ACTOR_ID
        }
      });
      sectionIds.set(sectionKey, section.id);
    }

    const allowedRows = menu.filter(([categorySlug]) => definition.categorySlugs.includes(categorySlug as never));
    const allowedIds: string[] = [];

    for (const [categorySlug, slug, nameAr, nameEn] of allowedRows) {
      const productId = productIds.get(slug);
      const sectionKey = definition.sectionKey ?? categorySlug;
      const sectionId = sectionIds.get(sectionKey);
      if (!productId || !sectionId) throw new Error(`Missing authority membership dependency for ${slug}`);
      allowedIds.push(productId);
      const sortOrder = (menu.filter(([candidate]) => candidate === categorySlug).findIndex(([, candidateSlug]) => candidateSlug === slug) + 1) * 10;
      await prisma.menuCollectionProduct.upsert({
        where: { collectionId_productId: { collectionId: collection.id, productId } },
        create: {
          collectionId: collection.id,
          sectionId,
          productId,
          sortOrder,
          membershipSource: "MANUAL",
          sourceReason: "Deterministic P22 approved menu authority seed.",
          isFeatured: false,
          createdBy: P22_ACTOR_ID,
          updatedBy: P22_ACTOR_ID
        },
        update: {
          sectionId,
          sortOrder,
          titleArOverride: null,
          titleEnOverride: null,
          membershipSource: "MANUAL",
          sourceReason: "Deterministic P22 approved menu authority seed.",
          archivedAt: null,
          updatedBy: P22_ACTOR_ID
        }
      });
    }

    await prisma.menuCollectionProduct.updateMany({
      where: {
        collectionId: collection.id,
        productId: { notIn: allowedIds },
        archivedAt: null
      },
      data: {
        archivedAt: new Date(),
        updatedBy: P22_ACTOR_ID
      }
    });
  }

  const previousHealthySnacks = await prisma.productCategory.findUnique({ where: { slug: "healthy-snacks" } });
  if (previousHealthySnacks) {
    const remainingProducts = await prisma.catalogProduct.count({ where: { categoryId: previousHealthySnacks.id } });
    if (remainingProducts === 0) {
      await prisma.productCategory.update({
        where: { id: previousHealthySnacks.id },
        data: {
          brandKey: "LEGACY",
          name: "Healthy Snacks (Merged)",
          nameAr: "السناك الصحي (مدمج)",
          nameEn: "Healthy Snacks (Merged)"
        }
      });
    }
  }

  const coffeeAddons = ["Cream", "Nutella", "Pistachio", "Caramel", "Hazelnut", "Strawberry", "Extra Espresso Shot"];
  const coffeeProducts = await prisma.catalogProduct.findMany({ where: { brandKey: BRAND, category: { slug: { in: ["hot-coffee", "iced-coffee", "salora-signature"] } } }, select: { id: true } });
  for (const product of coffeeProducts) {
    if (await prisma.productAddon.count({ where: { productId: product.id } }) === 0) {
      await prisma.productAddon.createMany({ data: coffeeAddons.map((name) => ({ productId: product.id, name, price: 0 })) });
    }
    if (await prisma.productModifier.count({ where: { productId: product.id } }) === 0) {
      await prisma.productModifier.createMany({ data: [
        { productId: product.id, name: "Milk", required: true, options: [{ id: "regular", name: "Regular Milk", priceDelta: 0 }, { id: "oat", name: "Oat Milk", priceDelta: 0 }, { id: "almond", name: "Almond Milk", priceDelta: 0 }] },
        { productId: product.id, name: "Sugar", required: true, options: [{ id: "none", name: "No Sugar", priceDelta: 0 }, { id: "less", name: "Less Sugar", priceDelta: 0 }, { id: "regular", name: "Regular Sugar", priceDelta: 0 }] }
      ] });
    }
  }

  console.info(`SALORA catalog seed completed: ${categories.length} categories and ${menu.length} products. Draft-priced items remain hidden.`);
}

main().finally(async () => prisma.$disconnect());
