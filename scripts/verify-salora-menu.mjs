import fs from "node:fs";

const source = fs.readFileSync(new URL("../prisma/seed.salora-menu.ts", import.meta.url), "utf8");
const menuBlock = source.match(/const menu: MenuRow\[\] = \[([\s\S]*?)\n\];/u)?.[1];
const categoryBlock = source.match(/const categories = \[([\s\S]*?)\n\] as const;/u)?.[1];
if (!menuBlock || !categoryBlock) throw new Error("SALORA menu authority dataset was not found.");

const rows = [...menuBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(null|\d+(?:\.\d+)?)/gmu)]
  .map((match) => ({
    category: match[1],
    slug: match[2],
    nameAr: match[3],
    nameEn: match[4],
    price: match[5] === "null" ? null : Number(match[5])
  }));
const categories = [...categoryBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\],?$/gmu)]
  .map((match) => ({ slug: match[1], nameAr: match[2], nameEn: match[3] }));

const expectedCategoryOrder = [
  "hot-coffee", "iced-coffee", "specialty-coffee", "hot-drinks",
  "matcha", "iced-tea", "fresh-juices", "fruit-cocktails",
  "mocktails", "milkshakes", "frappes", "smoothies",
  "desserts", "healthy-wellness", "kids-drinks", "salora-signature"
];
const expectedDrafts = [
  "salora-latte", "salora-cappuccino", "pistachio-spanish-latte",
  "peanut-butter-latte", "pistachio-espresso", "brazilian-lemonade",
  "pina-colada", "strawberry-milkshake", "protein-shake", "berry-detox"
].sort();
const actualDrafts = rows.filter((row) => row.price === null).map((row) => row.slug).sort();

if (rows.length !== 117) throw new Error(`Expected 117 SALORA products, found ${rows.length}.`);
if (new Set(rows.map((row) => row.slug)).size !== 117) throw new Error("SALORA product slugs must be unique.");
if (categories.length !== 16 || new Set(categories.map((row) => row.slug)).size !== 16) {
  throw new Error("SALORA requires exactly 16 unique categories.");
}
if (rows.filter((row) => row.price !== null).length !== 107) throw new Error("SALORA requires exactly 107 priced ACTIVE products.");
if (actualDrafts.length !== 10) throw new Error("SALORA requires exactly 10 missing-price DRAFT products.");
if (JSON.stringify(actualDrafts) !== JSON.stringify(expectedDrafts)) {
  throw new Error(`Draft set mismatch. Found: ${actualDrafts.join(", ")}.`);
}
if (JSON.stringify(categories.map((row) => row.slug)) !== JSON.stringify(expectedCategoryOrder)) {
  throw new Error("SALORA category order does not match the approved print authority.");
}
if (rows.some((row) => !row.nameAr.trim() || !row.nameEn.trim())) {
  throw new Error("Every SALORA product requires Arabic and English names.");
}
if (!source.includes("status, basePrice: price ?? 0")) {
  throw new Error("The seed update path must deterministically synchronize status and price.");
}
if (!source.includes('"salora-menu"') || !source.includes('"salora-wellness"') || !source.includes('"salora-kids"')) {
  throw new Error("The deterministic collection seed contract is missing.");
}

for (const slug of ["awar-qalb", "bahr", "khayal"]) {
  const product = rows.find((row) => row.slug === slug);
  if (!product || product.price !== 2) throw new Error(`${slug} must be priced at 2.000 OMR.`);
}

console.info("SALORA menu verified: 117 unique bilingual products, 107 ACTIVE, 10 DRAFT, 16 ordered categories.");