import fs from "node:fs";

const source = fs.readFileSync(new URL("../prisma/seed.salora-menu.ts", import.meta.url), "utf8");
const menuBlock = source.match(/const menu: MenuRow\[\] = \[([\s\S]*?)\n\];/u)?.[1];
if (!menuBlock) throw new Error("SALORA menu dataset was not found.");

const rows = [...menuBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(null|\d+(?:\.\d+)?)/gmu)]
  .map((match) => ({ category: match[1], slug: match[2], nameAr: match[3], nameEn: match[4], price: match[5] }));
const slugs = new Set(rows.map((row) => row.slug));
const categories = new Set(rows.map((row) => row.category));
const expectedHealthySlugs = new Set([
  "protein-shake",
  "collagen-drink",
  "healthy-pistachio-milkshake",
  "healthy-chocolate-milkshake",
  "keto-milkshake",
  "green-detox-stevia",
  "lemon-mint-detox",
  "berry-detox",
  "protein-bar"
]);
const expectedKidsSlugs = new Set([
  "babyccino",
  "strawberry-vanilla-milk",
  "nesquik-chocolate-milk",
  "nutella-milk"
]);

function assertExactCategory(category, expectedSlugs) {
  const actual = rows.filter((row) => row.category === category).map((row) => row.slug);
  const actualSlugs = new Set(actual);
  const missing = [...expectedSlugs].filter((slug) => !actualSlugs.has(slug));
  const unexpected = actual.filter((slug) => !expectedSlugs.has(slug));
  if (actual.length !== actualSlugs.size || missing.length > 0 || unexpected.length > 0) {
    throw new Error(`${category} classification mismatch. Missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}.`);
  }
}

if (rows.length !== 117) throw new Error(`Expected 117 SALORA products, found ${rows.length}.`);
if (slugs.size !== rows.length) throw new Error("SALORA product slugs must be unique.");
if (categories.size !== 16) throw new Error(`Expected 16 SALORA categories, found ${categories.size}.`);
if (rows.some((row) => !row.nameAr.trim() || !row.nameEn.trim())) throw new Error("Every SALORA product requires Arabic and English names.");
if (!rows.some((row) => row.price === "null")) throw new Error("Unpriced products must remain explicit drafts.");
if (!source.includes('["healthy-wellness", "قائمة الصحة", "Healthy Menu"]')) throw new Error("Healthy Menu category labels are missing.");
if (!source.includes('["kids-drinks", "قائمة الأطفال", "Kids Menu"]')) throw new Error("Kids Menu category labels are missing.");
if (categories.has("healthy-snacks")) throw new Error("Healthy Snacks must be consolidated into Healthy Menu.");
assertExactCategory("healthy-wellness", expectedHealthySlugs);
assertExactCategory("kids-drinks", expectedKidsSlugs);

console.info(`SALORA menu verified: ${rows.length} bilingual products across ${categories.size} categories.`);
