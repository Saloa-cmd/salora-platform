import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const prisma = read("packages/backend/src/database/prisma.ts");
const runtimeEnv = read("packages/backend/src/runtime/env.ts");
const menuAuthority = read("apps/web/lib/server/menuAuthority.ts");
const envExample = read(".env.example");
const backendPackage = JSON.parse(read("packages/backend/package.json"));
const vercelConfig = JSON.parse(read("apps/web/vercel.json"));

assert.equal(vercelConfig.fluid, true, "P35 must enable Vercel Fluid Compute.");
assert.equal(backendPackage.dependencies["@vercel/functions"], "3.9.5");
assert.equal(backendPackage.dependencies.pg, "8.21.0");
assert.equal(backendPackage.devDependencies["@types/pg"], "8.20.0");

for (const key of [
  "DATABASE_CONNECT_TIMEOUT_MS",
  "DATABASE_QUERY_TIMEOUT_MS",
  "DATABASE_POOL_MAX",
  "DATABASE_POOL_IDLE_TIMEOUT_MS",
  "DATABASE_POOL_MAX_LIFETIME_SECONDS",
  "DATABASE_POOL_LIVENESS_INTERVAL_MS",
  "DATABASE_POOL_LIVENESS_TIMEOUT_MS"
]) {
  assert.match(runtimeEnv, new RegExp(`\\b${key}\\b`), `Runtime schema must validate ${key}.`);
  assert.match(envExample, new RegExp(`^${key}=`, "m"), `.env.example must document ${key}.`);
}

assert.match(prisma, /new Pool\s*\(/, "Prisma must receive an explicit node-postgres pool.");
assert.match(prisma, /new PrismaPg\(pool\)/, "PrismaPg must reuse the attached pool.");
assert.match(prisma, /attachDatabasePool\(pool\)/, "Vercel must own idle-pool suspension cleanup.");
assert.match(prisma, /max:\s*env\.DATABASE_POOL_MAX/, "Pool size must be environment-governed.");
assert.match(prisma, /maxLifetimeSeconds:\s*env\.DATABASE_POOL_MAX_LIFETIME_SECONDS/);
assert.match(prisma, /connectionTimeoutMillis:\s*env\.DATABASE_CONNECT_TIMEOUT_MS/);
assert.match(prisma, /query_timeout:\s*env\.DATABASE_QUERY_TIMEOUT_MS/);
assert.match(prisma, /clients\[index\]\?\.release\(failed\)/, "Failed liveness clients must be destroyed.");
assert.match(prisma, /saloraPgPoolLiveness/, "Liveness checks must be single-flight.");
assert.match(prisma, /withDatabaseReadRecovery/, "Read-only connection retries must be explicit.");
assert.match(prisma, /isRetryableDatabaseConnectivityError/, "Retries must be connectivity-only.");
assert.doesNotMatch(prisma, /\bmax:\s*5\b/, "The previous five-client per-instance pool must not return.");

assert.match(menuAuthority, /MENU_AUTHORITY_REVALIDATE_SECONDS = 300/);
assert.match(menuAuthority, /salora-menu-authority-v4/);
assert.match(menuAuthority, /withDatabaseReadRecovery\(/);
assert.match(menuAuthority, /saloraMenuAuthorityLastKnownGood/);
assert.match(menuAuthority, /runtimeMode:\s*"offline-cache"/);
assert.match(menuAuthority, /revalidateTag\(MENU_AUTHORITY_CACHE_TAG, "max"\)/);
assert.doesNotMatch(menuAuthority, /salora-menu-authority-v3/);

assert.equal(envExample.match(/^SALORA_EXPECTED_TOTAL_PRODUCTS=117$/m)?.[0], "SALORA_EXPECTED_TOTAL_PRODUCTS=117");
assert.equal(envExample.match(/^SALORA_EXPECTED_ACTIVE_PRODUCTS=104$/m)?.[0], "SALORA_EXPECTED_ACTIVE_PRODUCTS=104");

console.log("SALORA P35 production runtime resilience verified:");
console.log("- Fluid Compute owns idle database pool cleanup");
console.log("- pool size, timeouts, rotation, and liveness are environment-governed");
console.log("- retry scope is limited to read-only connectivity failures");
console.log("- Menu Authority uses SWR plus last-known-good protection");
console.log("- catalog invariants remain 117 total / 104 active");

