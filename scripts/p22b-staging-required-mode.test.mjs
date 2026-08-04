import assert from "node:assert/strict";
import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";
import { isMenuRevisionContractV2 } from "../packages/backend/src/domains/menu-collections/revision-contract.ts";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

assert.equal(process.env.SALORA_ENVIRONMENT, "staging", "Certification is restricted to staging.");
assert.equal(process.env.SALORA_MENU_AUTHORITY_MODE, "required", "Required authority mode must be enabled.");
assert.equal(process.env.ALLOW_STAGING_CERTIFICATION, "true", "Explicit staging certification approval is required.");

const expectedRef = required("SALORA_EXPECTED_SUPABASE_PROJECT_REF");
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is required.");
assert.ok(connectionString.includes(expectedRef), "Database connection does not match the expected staging project.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const collection = await prisma.menuCollection.findFirst({
    where: {
      brandKey: "SALORA",
      key: "salora-menu",
      status: "PUBLISHED",
      archivedAt: null,
      activeRevisionId: { not: null }
    },
    include: {
      activeRevision: true,
      sections: { where: { archivedAt: null } },
      products: {
        where: { archivedAt: null },
        include: { product: { select: { slug: true, status: true, basePrice: true } } }
      },
      publications: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 1
      }
    }
  });

  assert.ok(collection, "Published SALORA menu collection is missing.");
  assert.ok(collection.activeRevision, "Active menu revision is missing.");
  assert.ok(isMenuRevisionContractV2(collection.activeRevision.snapshot), "Active revision is not contractVersion 2.");

  const uniqueSlugs = new Set(collection.products.map((item) => item.product.slug));
  const active = collection.products.filter((item) => item.product.status === "ACTIVE").length;
  const draft = collection.products.filter((item) => item.product.status === "DRAFT").length;

  assert.equal(collection.products.length, 117);
  assert.equal(uniqueSlugs.size, 117);
  assert.equal(active, 104);
  assert.equal(draft, 13);
  assert.equal(collection.sections.length, 16);
  assert.ok(collection.publications.length > 0, "Published history is missing.");

  const baseUrl = process.env.SALORA_STAGING_BASE_URL?.replace(/\/+$/, "");
  if (baseUrl) {
    const [menuPageResponse, authorityResponse, productsResponse, readyResponse] = await Promise.all([
      fetch(`${baseUrl}/menu`, { headers: { "cache-control": "no-cache" } }),
      fetch(`${baseUrl}/api/v1/menu-authority`, { headers: { "cache-control": "no-cache" } }),
      fetch(`${baseUrl}/api/products`, { headers: { "cache-control": "no-cache" } }),
      fetch(`${baseUrl}/api/ready`, { headers: { "cache-control": "no-cache" } })
    ]);
    assert.equal(menuPageResponse.status, 200, "Website/QR menu page failed.");
    assert.equal(authorityResponse.status, 200, "Menu Authority API failed.");
    assert.equal(productsResponse.status, 200, "Products compatibility API failed.");
    assert.equal(readyResponse.status, 200, "Readiness endpoint failed.");

    const authority = await authorityResponse.json();
    const products = await productsResponse.json();
    const ready = await readyResponse.json();

    assert.equal(authority.runtime?.source, "published-revision");
    assert.equal(authority.data?.revision?.id, collection.activeRevisionId);
    assert.equal(products.authority?.revision?.id, collection.activeRevisionId);
    assert.equal(ready.checks?.catalogRevisionId, collection.activeRevisionId);
    assert.equal(ready.checks?.catalogLive, true);

    if (process.env.ALLOW_STAGING_ANALYTICS_WRITE === "true") {
      const analyticsResponse = await fetch(`${baseUrl}/api/analytics/menu-event`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventType: "view",
          revisionId: collection.activeRevisionId,
          channel: "qr",
          metadata: { certification: "P22B_STAGING_REQUIRED_MODE" }
        })
      });
      assert.equal(analyticsResponse.status, 202, "Revision-scoped analytics smoke test failed.");
    }

    if (process.env.ALLOW_STAGING_AI_SMOKE === "true") {
      const aiResponse = await fetch(`${baseUrl}/api/ai/recommendations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "Recommend one currently published SALORA product.",
          channel: "web",
          locale: "en"
        })
      });
      assert.equal(aiResponse.status, 200, "AI published-revision smoke test failed.");
      assert.equal(aiResponse.headers.get("x-salora-menu-revision"), collection.activeRevisionId);
    }
  }

  console.log("SALORA P22B Staging required-mode certification passed:");
  console.log("- active revision uses contractVersion 2");
  console.log("- catalog authority is 117 / 104 / 13 across 16 sections");
  console.log("- published history is present");
  console.log(baseUrl ? "- Website, QR, mobile contract API and readiness endpoints passed" : "- runtime URL checks were not requested");
  console.log(process.env.ALLOW_STAGING_ANALYTICS_WRITE === "true" ? "- staging analytics event passed" : "- analytics write smoke was not requested");
  console.log(process.env.ALLOW_STAGING_AI_SMOKE === "true" ? "- staging AI revision smoke passed" : "- AI smoke was not requested");
} finally {
  await prisma.$disconnect();
}
