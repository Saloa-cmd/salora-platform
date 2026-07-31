import { readFileSync } from "node:fs";

const useDatabase = process.argv.includes("--database");
const seedUrl = new URL("../prisma/seed.salora-menu.ts", import.meta.url);
const source = readFileSync(seedUrl, "utf8");

function extractBlock(pattern, label) {
  const match = source.match(pattern);
  if (!match?.[1]) throw new Error(`${label} block was not found in prisma/seed.salora-menu.ts.`);
  return match[1];
}

const categoryBlock = extractBlock(/const categories = \[([\s\S]*?)\n\] as const;/u, "Category");
const menuBlock = extractBlock(/const menu: MenuRow\[\] = \[([\s\S]*?)\n\];/u, "Menu");
const sourceCategories = [...categoryBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\],?$/gmu)]
  .map((match) => ({ slug: match[1], nameAr: match[2], nameEn: match[3] }));
const sourceProducts = [...menuBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(null|\d+(?:\.\d+)?)/gmu)]
  .map((match) => ({ category: match[1], slug: match[2], nameAr: match[3], nameEn: match[4], price: match[5] === "null" ? null : Number(match[5]) }));

const sourceCategorySlugs = new Set(sourceCategories.map((row) => row.slug));
const sourceProductSlugs = new Set(sourceProducts.map((row) => row.slug));
const sourceDrafts = sourceProducts.filter((row) => row.price === null);
const sourceActive = sourceProducts.filter((row) => row.price !== null);
const orphanSourceProducts = sourceProducts.filter((row) => !sourceCategorySlugs.has(row.category));

const sourceIssues = [];
if (sourceProducts.length !== sourceProductSlugs.size) sourceIssues.push("Duplicate product slugs exist in the source catalog.");
if (sourceCategories.length !== sourceCategorySlugs.size) sourceIssues.push("Duplicate category slugs exist in the source catalog.");
if (orphanSourceProducts.length > 0) sourceIssues.push(`${orphanSourceProducts.length} source products reference an unknown category.`);
if (sourceProducts.some((row) => !row.nameAr.trim() || !row.nameEn.trim())) sourceIssues.push("One or more products are missing a bilingual name.");

console.log("SALORA catalog authority audit — source");
console.table({
  products: sourceProducts.length,
  categories: sourceCategories.length,
  activeByPrice: sourceActive.length,
  draftByMissingPrice: sourceDrafts.length
});
console.log(`Category slugs: ${sourceCategories.map((row) => row.slug).join(", ")}`);

if (sourceIssues.length > 0) {
  for (const issue of sourceIssues) console.error(`ERROR: ${issue}`);
  process.exitCode = 1;
}

if (!useDatabase) {
  console.log("\nDatabase comparison was not requested. Run pnpm audit:catalog:database with encrypted DATABASE_URL or DIRECT_URL already present in the environment.");
  process.exit();
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL or DIRECT_URL is required for the read-only database comparison. Do not paste credentials into chat.");
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
      select: { id: true, slug: true, nameAr: true, nameEn: true, sortOrder: true, _count: { select: { products: true } } }
    }),
    prisma.catalogProduct.groupBy({
      by: ["status"],
      where: { brandKey: "SALORA" },
      _count: { _all: true }
    }),
    prisma.catalogProduct.findMany({
      where: { brandKey: "SALORA" },
      select: { slug: true, status: true, category: { select: { slug: true } } }
    })
  ]);

  const databaseCategorySlugs = new Set(databaseCategories.map((row) => row.slug));
  const databaseProductSlugs = new Set(databaseProducts.map((row) => row.slug));
  const missingCategoriesInDatabase = sourceCategories.filter((row) => !databaseCategorySlugs.has(row.slug));
  const extraCategoriesInDatabase = databaseCategories.filter((row) => !sourceCategorySlugs.has(row.slug));
  const missingProductsInDatabase = sourceProducts.filter((row) => !databaseProductSlugs.has(row.slug));
  const extraProductsInDatabase = databaseProducts.filter((row) => !sourceProductSlugs.has(row.slug));
  const categoryMismatches = databaseProducts.filter((row) => {
    const sourceProduct = sourceProducts.find((candidate) => candidate.slug === row.slug);
    return sourceProduct && sourceProduct.category !== row.category.slug;
  });

  console.log("\nSALORA catalog authority audit — database");
  console.table({
    products: databaseProducts.length,
    categories: databaseCategories.length,
    active: groupedStatuses.find((row) => row.status === "ACTIVE")?._count._all ?? 0,
    draft: groupedStatuses.find((row) => row.status === "DRAFT")?._count._all ?? 0,
    paused: groupedStatuses.find((row) => row.status === "PAUSED")?._count._all ?? 0,
    archived: groupedStatuses.find((row) => row.status === "ARCHIVED")?._count._all ?? 0
  });
  console.table(databaseCategories.map((row) => ({
    slug: row.slug,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    products: row._count.products,
    sortOrder: row.sortOrder
  })));

  const differences = [
    ["missing categories", missingCategoriesInDatabase.map((row) => row.slug)],
    ["extra SALORA categories", extraCategoriesInDatabase.map((row) => row.slug)],
    ["missing products", missingProductsInDatabase.map((row) => row.slug)],
    ["extra SALORA products", extraProductsInDatabase.map((row) => row.slug)],
    ["category assignment mismatches", categoryMismatches.map((row) => row.slug)]
  ];
  for (const [label, values] of differences) {
    console.log(`${label}: ${values.length ? values.join(", ") : "none"}`);
  }

  if (differences.some(([, values]) => values.length > 0)) process.exitCode = 1;
  else console.log("\nSource and database catalog authority match exactly.");
} finally {
  await prisma.$disconnect();
}
