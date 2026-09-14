import assert from "node:assert/strict";
import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";

const NON_PRODUCTION_REFS = new Set(["grcycqdtjjfklibutfos", "errmouqcepkljncoefdd"]);
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};
assert.equal(process.env.SALORA_ENVIRONMENT, "production", "Production certification is restricted to SALORA_ENVIRONMENT=production.");
const expectedRef = required("SALORA_EXPECTED_SUPABASE_PROJECT_REF");
assert.ok(!NON_PRODUCTION_REFS.has(expectedRef), "Known Staging/Test Supabase projects cannot pass Production certification.");
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");
assert.ok(connectionString.includes(expectedRef), "Database connection does not match the expected Production project ref.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const [counts] = await prisma.$queryRawUnsafe(`
    select
      count(*) filter (where brand_key = 'SALORA')::int as "total",
      count(*) filter (where brand_key = 'SALORA' and status = 'ACTIVE')::int as "active",
      count(*) filter (
        where brand_key = 'SALORA'
          and (
            lower(slug) ~ 'pos[_-]?test|test[_-]?only|synthetic'
            or lower(name) ~ 'pos[ _-]?test|test[ _-]?only|synthetic'
          )
      )::int as "synthetic"
    from public.catalog_products
  `);

  const [authority] = await prisma.$queryRawUnsafe(`
    select
      (select count(*)::int from public.menu_collections where brand_key = 'SALORA') as "collections",
      (select count(*)::int from public.menu_collection_revisions where status = 'PUBLISHED') as "publishedRevisions",
      (select count(*)::int from public.menu_publications where status = 'PUBLISHED') as "publishedPublications",
      r.id::text as "activeRevisionId",
      r.version::int as "activeRevisionVersion",
      r.checksum as "activeRevisionChecksum",
      jsonb_array_length(r.snapshot -> 'products')::int as "publishedProducts",
      (r.snapshot ->> 'contractVersion')::int as "contractVersion"
    from public.menu_collections c
    join public.menu_collection_revisions r on r.id = c.active_revision_id
    where c.brand_key = 'SALORA'
      and c.key = 'salora-menu'
      and c.archived_at is null
  `);

  const result = {
    expectedProjectRef: expectedRef,
    authority: {
      activeRevisionId: authority?.activeRevisionId ?? null,
      activeRevisionVersion: Number(authority?.activeRevisionVersion ?? 0),
      activeRevisionChecksum: authority?.activeRevisionChecksum ?? null,
      contractVersion: Number(authority?.contractVersion ?? 0),
      publishedProducts: Number(authority?.publishedProducts ?? 0)
    },
    observed: {
      totalProducts: Number(counts?.total ?? 0),
      activeProducts: Number(counts?.active ?? 0),
      syntheticProducts: Number(counts?.synthetic ?? 0),
      collections: Number(authority?.collections ?? 0),
      publishedRevisions: Number(authority?.publishedRevisions ?? 0),
      publishedPublications: Number(authority?.publishedPublications ?? 0)
    }
  };

  console.log("SALORA Production Data certification (READ ONLY):");
  console.log(JSON.stringify(result, null, 2));

  assert.ok(result.authority.activeRevisionId, "An active published Menu Authority revision is required.");
  assert.match(result.authority.activeRevisionChecksum ?? "", /^[a-f0-9]{64}$/u, "The active revision requires a SHA-256 checksum.");
  assert.ok(result.authority.contractVersion > 0, "The active revision contractVersion is required.");
  assert.ok(result.authority.publishedProducts > 0, "The active revision must contain products.");
  assert.equal(result.observed.totalProducts, result.authority.publishedProducts, "Production database total differs from the active published revision.");
  assert.equal(result.observed.activeProducts, result.authority.publishedProducts, "Production ACTIVE count differs from the active published revision.");
  assert.equal(result.observed.syntheticProducts, 0, "Synthetic/Test products must never exist in the Production SALORA catalog.");
  assert.ok(result.observed.collections > 0, "At least one SALORA Menu Authority collection is required.");
  assert.ok(result.observed.publishedRevisions > 0, "At least one published Menu Authority revision is required.");
  assert.ok(result.observed.publishedPublications > 0, "At least one successful Menu Authority publication is required.");

  console.log("PRODUCTION_DATA_CERTIFICATION_PASS");
} finally {
  await prisma.$disconnect();
}
