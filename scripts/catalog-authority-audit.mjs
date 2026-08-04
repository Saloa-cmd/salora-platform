import { readFileSync } from "node:fs";

const useDatabase = process.argv.includes("--database");
const source = readFileSync(new URL("../prisma/seed.salora-menu.ts", import.meta.url), "utf8");

function extractBlock(pattern, label) {
  const match = source.match(pattern);
  if (!match?.[1]) throw new Error(`${label} block was not found in prisma/seed.salora-menu.ts.`);
  return match[1];
}

const categoryBlock = extractBlock(/const categories = \[([\s\S]*?)\n\] as const;/u, "Category");
const menuBlock = extractBlock(/const menu: MenuRow\[\] = \[([\s\S]*?)\n\];/u, "Menu");
const sourceCategories = [...categoryBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\],?$/gmu)]
  .map((match, index) => ({ slug: match[1], nameAr: match[2], nameEn: match[3], sortOrder: (index + 1) * 10 }));
const sourceProducts = [...menuBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(null|\d+(?:\.\d+)?)/gmu)]
  .map((match) => ({
    category: match[1],
    slug: match[2],
    nameAr: match[3],
    nameEn: match[4],
    price: match[5] === "null" ? null : Number(match[5])
  }));

const sourceCategorySlugs = new Set(sourceCategories.map((row) => row.slug));
const sourceProductSlugs = new Set(sourceProducts.map((row) => row.slug));
const sourceDrafts = sourceProducts.filter((row) => row.price === null);
const sourceActive = sourceProducts.filter((row) => row.price !== null);
const issues = [];

if (sourceProducts.length !== 117) issues.push(`Expected 117 products, found ${sourceProducts.length}.`);
if (sourceCategories.length !== 16) issues.push(`Expected 16 categories, found ${sourceCategories.length}.`);
if (sourceActive.length !== 104) issues.push(`Expected 104 ACTIVE-by-price products, found ${sourceActive.length}.`);
if (sourceDrafts.length !== 13) issues.push(`Expected 13 DRAFT-by-missing-price products, found ${sourceDrafts.length}.`);
if (sourceProducts.length !== sourceProductSlugs.size) issues.push("Duplicate product slugs exist.");
if (sourceCategories.length !== sourceCategorySlugs.size) issues.push("Duplicate category slugs exist.");
if (sourceProducts.some((row) => !sourceCategorySlugs.has(row.category))) issues.push("Orphan product categories exist.");
if (sourceProducts.some((row) => !row.nameAr.trim() || !row.nameEn.trim())) issues.push("Missing bilingual names exist.");

console.log("SALORA catalog authority audit — source");
console.table({
  products: sourceProducts.length,
  categories: sourceCategories.length,
  activeByPrice: sourceActive.length,
  draftByMissingPrice: sourceDrafts.length
});
if (issues.length) {
  issues.forEach((issue) => console.error(`ERROR: ${issue}`));
  process.exitCode = 1;
}

if (!useDatabase) {
  console.log("\nDatabase comparison was not requested. Use audit:catalog:database only with an approved non-production connection.");
  process.exit();
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL or DIRECT_URL is required. Never paste credentials into chat.");
  process.exit(1);
}

const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
  import("../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs"),
  import("../packages/backend/src/database/generated/client.ts")
]);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const [databaseCategories, groupedStatuses, databaseProducts] = await Promise.all([
    prisma.productCategory.findMany({
      where: { brandKey: "SALORA" },
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      select: { slug: true, nameAr: true, nameEn: true, sortOrder: true }
    }),
    prisma.catalogProduct.groupBy({
      by: ["status"],
      where: { brandKey: "SALORA" },
      _count: { _all: true }
    }),
    prisma.catalogProduct.findMany({
      where: { brandKey: "SALORA" },
      select: { slug: true, status: true, basePrice: true, category: { select: { slug: true } } }
    })
  ]);

  const databaseCategorySlugs = new Set(databaseCategories.map((row) => row.slug));
  const databaseProductSlugs = new Set(databaseProducts.map((row) => row.slug));
  const differences = [
    ["missing categories", sourceCategories.filter((row) => !databaseCategorySlugs.has(row.slug)).map((row) => row.slug)],
    ["extra categories", databaseCategories.filter((row) => !sourceCategorySlugs.has(row.slug)).map((row) => row.slug)],
    ["missing products", sourceProducts.filter((row) => !databaseProductSlugs.has(row.slug)).map((row) => row.slug)],
    ["extra products", databaseProducts.filter((row) => !sourceProductSlugs.has(row.slug)).map((row) => row.slug)],
    ["category mismatches", databaseProducts.filter((row) => sourceProducts.find((item) => item.slug === row.slug)?.category !== row.category.slug).map((row) => row.slug)],
    ["status mismatches", databaseProducts.filter((row) => {
      const expected = sourceProducts.find((item) => item.slug === row.slug);
      return expected && row.status !== (expected.price === null ? "DRAFT" : "ACTIVE");
    }).map((row) => row.slug)]
  ];

  const active = groupedStatuses.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const draft = groupedStatuses.find((row) => row.status === "DRAFT")?._count._all ?? 0;

  console.log("\nSALORA catalog authority audit — database");
  console.table({ products: databaseProducts.length, categories: databaseCategories.length, active, draft });
  differences.forEach(([label, values]) => console.log(`${label}: ${values.length ? values.join(", ") : "none"}`));

  if (databaseProducts.length !== 117 || databaseCategories.length !== 16 || active !== 104 || draft !== 13) {
    process.exitCode = 1;
  }
  if (differences.some(([, values]) => values.length)) process.exitCode = 1;
  if (!process.exitCode) console.log("\nSource and database authority match 117 / 104 / 13 exactly.");
} finally {
  await prisma.$disconnect();
}
