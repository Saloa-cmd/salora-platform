import assert from "node:assert/strict";

const baseUrl = new URL(process.env.SALORA_AUTHORITY_BASE_URL ?? "https://salora-platform.vercel.app");
const endpoint = (path) => new URL(path, baseUrl).toString();

async function fetchChecked(path) {
  const response = await fetch(endpoint(path), {
    headers: { accept: path.endsWith(".csv") ? "text/csv" : "application/json" },
    signal: AbortSignal.timeout(30_000)
  });
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return response;
}

function comparable(product) {
  return {
    id: product.id,
    catalogId: product.catalogId,
    menuRevisionId: product.menuRevisionId,
    sectionKey: product.sectionKey,
    name: product.name,
    nameAr: product.nameAr ?? null,
    nameEn: product.nameEn ?? null,
    category: product.category ?? null,
    categoryAr: product.categoryAr ?? null,
    categoryEn: product.categoryEn ?? null,
    description: product.description ?? null,
    descriptionAr: product.descriptionAr ?? null,
    descriptionEn: product.descriptionEn ?? null,
    price: product.price,
    visual: product.visual,
    featured: product.featured,
    tags: product.tags ?? [],
    badges: product.badges ?? [],
    variants: product.variants ?? [],
    addons: product.addons ?? [],
    modifierGroups: product.modifierGroups ?? []
  };
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const text = input.replace(/^\uFEFF/u, "");
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/u, "")); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const [productsResponse, authorityResponse, feedResponse] = await Promise.all([
  fetchChecked("/api/products"),
  fetchChecked("/api/v1/menu-authority"),
  fetchChecked("/api/integrations/meta/catalog-feed.csv")
]);

const productsBody = await productsResponse.json();
const authorityBody = await authorityResponse.json();
const feedText = await feedResponse.text();
const products = productsBody.data;
const authority = authorityBody.data;
const revision = authority.revision;

assert.ok(Array.isArray(products) && products.length > 0, "The current product API must return a non-empty authority.");
assert.ok(revision?.id && Number.isInteger(revision.version) && revision.version > 0, "A published revision ID and version are required.");
assert.match(revision.checksum ?? "", /^[a-f0-9]{64}$/u, "The published revision requires a SHA-256 checksum.");
assert.equal(productsBody.runtime?.source, "published-revision");
assert.equal(authorityBody.runtime?.source, "published-revision");
assert.equal(productsResponse.headers.get("x-salora-data-source"), "published-revision");
assert.equal(authorityResponse.headers.get("x-salora-menu-source"), "published-revision");
assert.equal(productsResponse.headers.get("x-salora-menu-revision"), revision.id);
assert.equal(authorityResponse.headers.get("x-salora-menu-revision"), revision.id);
assert.equal(productsResponse.headers.get("x-salora-menu-version"), String(revision.version));
assert.equal(authorityResponse.headers.get("x-salora-menu-version"), String(revision.version));
assert.equal(authorityResponse.headers.get("etag"), `"${revision.checksum}"`);

assert.equal(productsBody.authority?.revision?.id, revision.id);
assert.equal(productsBody.authority?.revision?.version, revision.version);
assert.equal(productsBody.authority?.revision?.checksum, revision.checksum);
assert.equal(authority.pagination.total, products.length);
assert.equal(authority.pagination.hasMore, false);
assert.equal(authority.products.length, products.length);
assert.equal(new Set(products.map((product) => product.id)).size, products.length);
assert.equal(new Set(products.map((product) => product.catalogId)).size, products.length);
assert.ok(products.every((product) => product.menuRevisionId === revision.id));
assert.ok(products.every((product) => Number.isFinite(product.price) && product.price > 0));
assert.ok(products.every((product) => typeof product.visual === "string" && product.visual.startsWith("https://")));

const apiById = new Map(products.map((product) => [product.id, comparable(product)]));
const authorityById = new Map(authority.products.map((product) => [product.id, comparable(product)]));
assert.deepEqual([...authorityById.keys()].sort(), [...apiById.keys()].sort());
for (const [id, product] of apiById) assert.deepEqual(authorityById.get(id), product, `Authority mismatch for ${id}`);

const csvRows = parseCsv(feedText);
const header = csvRows.shift();
assert.deepEqual(header, ["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand", "product_type"]);
assert.equal(csvRows.length, products.length);
assert.equal(feedResponse.headers.get("x-salora-menu-source"), "published-revision");
assert.equal(feedResponse.headers.get("x-salora-menu-revision"), revision.id);
assert.equal(Number(feedResponse.headers.get("x-salora-feed-items")), products.length);
assert.deepEqual(csvRows.map((row) => row[0]).sort(), products.map((product) => product.catalogId).sort());
assert.ok(csvRows.every((row) => row.length === header.length && row[3] === "in stock" && row[4] === "new" && row[6].startsWith("https://") && row[7].startsWith("https://") && row[8] === "SALORA"));

console.log(JSON.stringify({
  result: "CURRENT_AUTHORITY_MATCH",
  baseUrl: baseUrl.origin,
  count: products.length,
  revisionId: revision.id,
  revisionVersion: revision.version,
  checksum: revision.checksum,
  source: authorityBody.runtime.source,
  feedItems: csvRows.length
}, null, 2));
