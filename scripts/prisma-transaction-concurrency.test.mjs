import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function between(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `${label}: start marker is missing.`);
  assert.notEqual(end, -1, `${label}: end marker is missing.`);
  return source.slice(start, end);
}

// Reproduce the unsafe scheduling characteristic without connecting to any
// database: a single transaction client may only have one query in flight.
function singleClientProbe() {
  let active = 0;
  let maxActive = 0;

  return {
    get maxActive() {
      return maxActive;
    },
    async query() {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    }
  };
}

const unsafeProbe = singleClientProbe();
await Promise.all([
  unsafeProbe.query(),
  unsafeProbe.query(),
  unsafeProbe.query()
]);
assert.equal(
  unsafeProbe.maxActive,
  3,
  "The test must reproduce overlapping calls on one transaction client."
);

const safeProbe = singleClientProbe();
await safeProbe.query();
await safeProbe.query();
await safeProbe.query();
assert.equal(
  safeProbe.maxActive,
  1,
  "Sequential transaction reads must never overlap."
);

const menuService = read("packages/backend/src/domains/menu-collections/service.ts");
const schedulePublication = between(
  menuService,
  "async schedulePublication(",
  "async rollbackPublication(",
  "schedulePublication"
);
const rollbackPublication = between(
  menuService,
  "async rollbackPublication(",
  "\n  }\n}",
  "rollbackPublication"
);

for (const [label, scope] of [
  ["schedulePublication", schedulePublication],
  ["rollbackPublication", rollbackPublication]
]) {
  assert.doesNotMatch(
    scope,
    /Promise\.all\s*\(/,
    `${label} must not parallelize queries on its repository transaction client.`
  );
}

const controlTowerRepository = read("packages/backend/src/domains/control-tower/repository.ts");
const whatsappCommandCenter = between(
  controlTowerRepository,
  "whatsapp: {",
  "\n    },\n  };",
  "WhatsApp command center"
);
assert.doesNotMatch(
  whatsappCommandCenter,
  /Promise\.all\s*\(/,
  "WhatsApp command-center reads must be sequential inside the RLS transaction."
);

const mediaRoute = read("apps/web/app/api/control-tower/media/route.ts");
const mediaSummaryTransaction = between(
  mediaRoute,
  "repo.cms.run(async (db) => {",
  "const authoritative =",
  "media summary transaction"
);
assert.doesNotMatch(
  mediaSummaryTransaction,
  /Promise\.all\s*\(/,
  "Media summary reads must be sequential inside cms.run."
);

const menuAuthority = read("apps/web/lib/server/menuAuthority.ts");
const publishedRevisionRead = between(
  menuAuthority,
  "async function readPublishedRevision()",
  "async function readLegacyCatalog()",
  "published menu revision read"
);
assert.doesNotMatch(
  publishedRevisionRead,
  /\binclude\s*:/,
  "Published menu relations must not use concurrent Prisma include branches on one transaction client."
);
assert.doesNotMatch(
  publishedRevisionRead,
  /Promise\.all\s*\(/,
  "Published menu relation reads must remain sequential on one transaction client."
);
for (const modelRead of [
  "database.menuCollection.findFirst",
  "database.menuCollectionRevision.findUnique",
  "database.menuPublication.findFirst"
]) {
  assert.match(
    publishedRevisionRead,
    new RegExp(`await ${modelRead.replaceAll(".", "\\.")}`),
    `Published menu authority must await ${modelRead}.`
  );
}
assert.match(
  publishedRevisionRead,
  /upstream adapter serializes transaction queries/,
  "The Prisma adapter workaround must remain documented."
);

const rlsContext = read("packages/backend/src/database/rls-context.ts");
assert.match(
  rlsContext,
  /must not use Promise\.all for database calls/,
  "The transaction-client concurrency contract must remain documented."
);

console.log("Prisma transaction concurrency regression passed:");
console.log("- overlapping single-client calls reproduced without a database");
console.log("- menu publication and rollback reads are sequential");
console.log("- WhatsApp and media transaction reads are sequential");
console.log("- published menu relation reads are explicitly serialized");
console.log("- no Production database connection or write was attempted");
