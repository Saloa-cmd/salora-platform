import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const environment = required("SALORA_ENVIRONMENT");
assert.ok(["staging", "preview", "production"].includes(environment), "SALORA_ENVIRONMENT must identify staging, preview, or production.");
const expectedRef = required("SALORA_EXPECTED_SUPABASE_PROJECT_REF");
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");
assert.ok(connectionString.includes(expectedRef), "Database connection does not match SALORA_EXPECTED_SUPABASE_PROJECT_REF.");

const baseUrl = new URL(required("SALORA_AUTHORITY_BASE_URL"));
assert.equal(baseUrl.protocol, "https:", "Authority verification requires HTTPS.");
const endpoint = (path) => new URL(path, baseUrl).toString();
const [productsResponse, authorityResponse] = await Promise.all([
  fetch(endpoint("/api/products"), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) }),
  fetch(endpoint("/api/v1/menu-authority"), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) })
]);
assert.equal(productsResponse.status, 200, `/api/products returned ${productsResponse.status}`);
assert.equal(authorityResponse.status, 200, `/api/v1/menu-authority returned ${authorityResponse.status}`);
const productsBody = await productsResponse.json();
const authorityBody = await authorityResponse.json();
const publicProducts = productsBody.data;
const publicRevision = authorityBody.data?.revision;
assert.ok(Array.isArray(publicProducts) && publicProducts.length > 0, "Published product API must be non-empty.");
assert.ok(publicRevision?.id, "Published revision is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const [revisionRows, databaseProducts] = await Promise.all([
    prisma.$queryRawUnsafe(`
      select
        r.id::text as "id",
        r.version::int as "version",
        r.status::text as "status",
        r.checksum,
        r.snapshot,
        c.active_revision_id::text as "activeRevisionId",
        c.key as "collectionKey"
      from public.menu_collections c
      join public.menu_collection_revisions r on r.id = c.active_revision_id
      where c.brand_key = 'SALORA'
        and c.key = 'salora-menu'
        and c.archived_at is null
    `),
    prisma.$queryRawUnsafe(`
      select
        p.id::text as "id",
        p.slug,
        p.name_ar as "nameAr",
        p.name_en as "nameEn",
        p.base_price::text as "basePrice",
        p.status::text as "status",
        c.slug as "categorySlug",
        count(i.id)::int as "liveImages",
        count(i.id) filter (where i.is_primary)::int as "primaryImages"
      from public.catalog_products p
      join public.product_categories c on c.id = p.category_id
      left join public.product_images i
        on i.product_id = p.id
       and i.archived_at is null
       and i.deleted_at is null
      where p.brand_key = 'SALORA'
        and p.status = 'ACTIVE'
      group by p.id, p.slug, p.name_ar, p.name_en, p.base_price, p.status, c.slug
      order by p.slug
    `)
  ]);

  assert.equal(revisionRows.length, 1, "Exactly one active SALORA menu authority is required.");
  const revision = revisionRows[0];
  const checksum = createHash("sha256").update(stableJson(revision.snapshot)).digest("hex");
  assert.equal(revision.id, revision.activeRevisionId);
  assert.equal(revision.status, "PUBLISHED");
  assert.equal(checksum, revision.checksum, "Stored revision checksum does not match its immutable snapshot.");
  assert.equal(publicRevision.id, revision.id);
  assert.equal(publicRevision.version, revision.version);
  assert.equal(publicRevision.checksum, revision.checksum);

  const snapshotProducts = Array.isArray(revision.snapshot?.products) ? revision.snapshot.products : [];
  assert.equal(snapshotProducts.length, publicProducts.length, "Database revision snapshot and public API counts differ.");
  assert.equal(databaseProducts.length, publicProducts.length, "ACTIVE database read model and published API counts differ.");

  const databaseById = new Map(databaseProducts.map((product) => [product.id, product]));
  const snapshotIds = snapshotProducts.map((item) => item?.product?.id).filter(Boolean).sort();
  const publicIds = publicProducts.map((product) => product.catalogId).sort();
  assert.deepEqual([...databaseById.keys()].sort(), publicIds, "ACTIVE database product IDs differ from the published API.");
  assert.deepEqual(snapshotIds, publicIds, "Revision snapshot product IDs differ from the published API.");

  for (const product of publicProducts) {
    const row = databaseById.get(product.catalogId);
    assert.ok(row, `Missing database product ${product.catalogId}`);
    assert.equal(row.slug, product.id, `Slug mismatch for ${product.catalogId}`);
    assert.equal(row.nameAr, product.nameAr, `Arabic name mismatch for ${product.id}`);
    assert.equal(row.nameEn, product.nameEn, `English name mismatch for ${product.id}`);
    assert.equal(Number(row.basePrice), product.price, `Price mismatch for ${product.id}`);
    assert.equal(row.status, "ACTIVE", `Non-active published product ${product.id}`);
    assert.equal(row.categorySlug, product.sectionKey, `Category mismatch for ${product.id}`);
    assert.ok(Number(row.liveImages) > 0, `Missing live image for ${product.id}`);
    assert.equal(Number(row.primaryImages), 1, `Expected exactly one Primary live image for ${product.id}`);
  }

  console.log(JSON.stringify({
    result: "DATABASE_API_REVISION_MATCH",
    environment,
    projectRef: expectedRef,
    authorityOrigin: baseUrl.origin,
    count: publicProducts.length,
    revisionId: revision.id,
    revisionVersion: revision.version,
    checksum: revision.checksum,
    contractVersion: revision.snapshot?.contractVersion,
    primaryImages: databaseProducts.reduce((sum, product) => sum + Number(product.primaryImages), 0)
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
