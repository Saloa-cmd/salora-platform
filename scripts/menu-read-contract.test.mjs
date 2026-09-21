import assert from "node:assert/strict";
import {
  MENU_RESULT_PAGE_SIZE,
  MenuReadContractError,
  buildMenuReadModel,
  normalizeMenuSearch
} from "../apps/web/lib/server/menuReadModel.ts";

const sections = [
  { id: "section-breakfast", key: "breakfast", nameAr: "الإفطار", nameEn: "Breakfast", sortOrder: 5 },
  { id: "section-coffee", key: "coffee", nameAr: "القهوة", nameEn: "Coffee", sortOrder: 10 },
  { id: "section-matcha", key: "matcha", nameAr: "الماتشا", nameEn: "Matcha", sortOrder: 20 }
];

const products = Array.from({ length: 139 }, (_, index) => {
  const number = index + 1;
  const sectionKey = number <= 22 ? "breakfast" : number <= 135 ? "coffee" : "matcha";
  const isArabicNormalizationSample = number === 23;
  return {
    id: `product-${number}`,
    catalogId: `catalog-${number}`,
    menuRevisionId: "revision-v3",
    sectionKey,
    name: isArabicNormalizationSample ? "Iced Latte" : `SALORA Product ${number}`,
    nameAr: isArabicNormalizationSample ? "آيس لاتيه" : sectionKey === "matcha" ? `ماتشا ${number}` : `منتج سالورا ${number}`,
    nameEn: isArabicNormalizationSample ? "Iced Latte" : `SALORA Product ${number}`,
    category: sections.find((section) => section.key === sectionKey).nameEn,
    categoryAr: sections.find((section) => section.key === sectionKey).nameAr,
    categoryEn: sections.find((section) => section.key === sectionKey).nameEn,
    description: `Published SALORA item ${number}`,
    descriptionAr: `منتج منشور ${number}`,
    descriptionEn: `Published SALORA item ${number}`,
    story: `Editorial story ${number}`,
    pairing: `Pairing note ${number}`,
    price: Number((1 + number / 1000).toFixed(3)),
    tags: [sectionKey],
    badges: [],
    visual: `https://example.supabase.co/storage/v1/object/public/products/product-${number}.webp`,
    nutrition: { caloriesKcal: 100, verificationStatus: "VERIFIED" },
    allergens: { contains: [], mayContain: [], verificationStatus: "VERIFIED" },
    variants: [],
    addons: [],
    modifierGroups: []
  };
});

const authoritative = {
  collection: { id: "collection", key: "salora-menu", slug: "salora-menu", kind: "STANDARD", nameAr: "منيو سالورا", nameEn: "SALORA Menu" },
  revision: { id: "revision-v3", version: 3, checksum: "a".repeat(64), publishedAt: "2026-09-21T00:00:00.000Z" },
  sections,
  products,
  source: "published-revision",
  stale: false,
  runtimeMode: "live",
  databaseHealth: "available",
  generatedAt: "2026-09-21T00:00:00.000Z"
};

const defaultMenu = buildMenuReadModel(authoritative);
assert.equal(defaultMenu.selectedCategory, "breakfast", "The first published non-empty category must be deterministic.");
assert.equal(defaultMenu.products.length, 22, "Initial menu delivery must contain only the default category.");
assert.equal(defaultMenu.totalCatalogProducts, 139, "The read model must retain the full authority count for certification.");
assert.ok(defaultMenu.products.every((product) => !("story" in product)), "Card delivery must exclude editorial detail fields.");
assert.ok(defaultMenu.products.every((product) => !("pairing" in product)), "Card delivery must exclude future pairing data.");
assert.ok(defaultMenu.products.every((product) => !("nutrition" in product)), "Card delivery must exclude nutrition detail data.");
assert.ok(defaultMenu.products.every((product) => !("allergens" in product)), "Card delivery must exclude allergen detail data.");
assert.deepEqual(defaultMenu.categories.map(({ key, productCount }) => [key, productCount]), [
  ["breakfast", 22],
  ["coffee", 113],
  ["matcha", 4]
]);
assert.equal(defaultMenu.categories.reduce((sum, category) => sum + category.productCount, 0), 139);

const matchaMenu = buildMenuReadModel(authoritative, { category: "matcha" });
assert.equal(matchaMenu.products.length, 4);
assert.ok(matchaMenu.products.every((product) => product.sectionKey === "matcha"));
assert.equal(new Set(matchaMenu.products.map((product) => product.id)).size, matchaMenu.products.length);

for (const product of matchaMenu.products) {
  const authorityProduct = products.find((candidate) => candidate.id === product.id);
  assert.equal(product.price, authorityProduct.price, `Price drift detected for ${product.id}.`);
  assert.equal(product.visual, authorityProduct.visual, `Primary visual drift detected for ${product.id}.`);
  assert.equal(product.menuRevisionId, authoritative.revision.id, `Revision drift detected for ${product.id}.`);
}

const globalSearch = buildMenuReadModel(authoritative, { category: "matcha", query: "salora" });
assert.equal(globalSearch.products.length, MENU_RESULT_PAGE_SIZE, "Search must be bounded on first delivery.");
assert.equal(globalSearch.resultTotal, 139);
assert.equal(globalSearch.hasMore, true);
assert.ok(globalSearch.products.every((product) => product.menuRevisionId === authoritative.revision.id));

const expandedSearch = buildMenuReadModel(authoritative, { query: "salora", limit: 48 });
assert.equal(expandedSearch.products.length, 48);
assert.equal(expandedSearch.resultTotal, 139);

const arabicSearch = buildMenuReadModel(authoritative, { query: "ايس لاتيه" });
assert.deepEqual(arabicSearch.products.map((product) => product.id), ["product-23"]);
assert.equal(normalizeMenuSearch("مَــاتْشَا"), "ماتشا");

const zeroResult = buildMenuReadModel(authoritative, { query: "غير موجود إطلاقًا" });
assert.equal(zeroResult.resultTotal, 0);
assert.deepEqual(zeroResult.products, []);

const fallback = {
  ...authoritative,
  revision: null,
  products: authoritative.products.map(({ menuRevisionId: _menuRevisionId, ...product }) => product),
  source: "legacy-catalog",
  stale: true,
  runtimeMode: "compatibility"
};
const fallbackBrowse = buildMenuReadModel(fallback, { category: "breakfast" });
assert.equal(fallbackBrowse.products.length, 22, "Controlled fallback may remain browseable.");
assert.equal(fallbackBrowse.searchAvailable, false);
const fallbackSearch = buildMenuReadModel(fallback, { query: "salora" });
assert.equal(fallbackSearch.resultTotal, 0, "Search must not claim stale fallback results are authoritative.");

assert.throws(
  () => buildMenuReadModel({ ...authoritative, products: [...products, products[0]] }),
  MenuReadContractError
);
assert.throws(
  () => buildMenuReadModel({ ...authoritative, products: products.map((product, index) => index === 0 ? { ...product, sectionKey: "unknown" } : product) }),
  /active published section/
);
assert.throws(
  () => buildMenuReadModel({ ...authoritative, products: products.map((product, index) => index === 0 ? { ...product, price: 0 } : product) }),
  /invalid published price/
);
assert.throws(
  () => buildMenuReadModel({ ...authoritative, products: products.map((product, index) => index === 0 ? { ...product, menuRevisionId: "wrong-revision" } : product) }),
  /not projected from the active revision/
);

console.log("SALORA UX-02 Menu Read Contract passed:");
console.log("- default delivery is category-first and bounded");
console.log("- category counts, identity, revision, prices, and visuals preserve authority");
console.log("- Arabic/English search is normalized, global, bounded, and authoritative");
console.log("- legacy fallback remains explicit and cannot power certified search");
