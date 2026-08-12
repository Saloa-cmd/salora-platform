import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createPublicOperationalStatus } from "../apps/web/lib/server/publicOperationalStatus.ts";

const read = (path) => readFileSync(path, "utf8");

const retiredRuntimeFiles = [
  "apps/web/app/api/internal/p22c3c-runtime-readonly/route.ts",
  "apps/web/app/api/internal/p22c3c-http-transport-v5/route.ts",
  "apps/web/app/api/internal/p22c3c-production-snapshot-readonly/route.ts",
  "apps/web/app/api/internal/p22c3c-production-identity-readonly/route.ts",
  "apps/web/lib/server/p22c3cRuntimeQueries.ts",
  "packages/backend/src/database/p22c3c-readonly.ts",
  "scripts/p22c3c-runtime-readonly-gate.test.mjs"
];

for (const path of retiredRuntimeFiles) {
  assert.equal(existsSync(path), false, `Retired runtime artifact still exists: ${path}`);
}

function sourceFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|mjs)$/u.test(entry.name) ? [path] : [];
  });
}

const runtimeSource = [
  ...sourceFiles("apps/web/app"),
  ...sourceFiles("apps/web/lib"),
  ...sourceFiles("packages/backend/src")
].map(read).join("\n");

for (const retiredMarker of [
  "GATE_TOKEN_SHA256",
  "HTTP_TRANSPORT_ONLY_V5",
  "createP22C3CReadOnlyPrismaClient",
  "P22C3C_PREFLIGHT_DO",
  "P22C3C_SNAPSHOT_QUERY",
  "p22c3c-runtime-readonly",
  "p22c3c-production-snapshot-readonly",
  "p22c3c-production-identity-readonly",
  "p22c3c-http-transport-v5"
]) {
  assert.equal(runtimeSource.includes(retiredMarker), false, `Runtime marker was not retired: ${retiredMarker}`);
}

const hostileEvidence = {
  status: "ready",
  fingerprint: "fingerprint-value",
  fingerprints: ["fingerprint-value"],
  slug: "private-slug",
  slugs: ["private-slug"],
  token: "raw-token-value",
  authorization: "Bearer raw-token-value",
  connectionString: "postgresql://user:password@example.invalid/database",
  databaseUrl: "postgresql://user:password@example.invalid/database",
  nested: {
    secret: "raw-secret-value",
    directUrl: "postgresql://user:password@example.invalid/database"
  }
};

const serialized = JSON.parse(JSON.stringify(createPublicOperationalStatus(hostileEvidence)));
assert.deepEqual(serialized, { status: "ready" });

const forbiddenKey = /^(?:fingerprints?|slugs?|.*secrets?|.*tokens?|authorization|.*connection.*|database_?url|direct_?url)$/iu;

function assertSafeKeys(value, path = "payload") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSafeKeys(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.doesNotMatch(key, forbiddenKey, `Sensitive key serialized at ${path}.${key}`);
    assertSafeKeys(child, `${path}.${key}`);
  }
}

assertSafeKeys(serialized);
const serializedText = JSON.stringify(serialized);
for (const forbiddenValue of [
  "fingerprint-value",
  "private-slug",
  "raw-token-value",
  "raw-secret-value",
  "postgresql://",
  "Bearer "
]) {
  assert.equal(serializedText.includes(forbiddenValue), false, `Sensitive value serialized: ${forbiddenValue}`);
}

const healthRoute = read("apps/web/app/api/health/route.ts");
assert.match(healthRoute, /createPublicOperationalStatus/u);
assert.match(healthRoute, /status: "ok"/u);
assert.doesNotMatch(healthRoute, /@salora\/(?:backend|data)/u);
assert.doesNotMatch(healthRoute, /database|redis|queue|catalog|process\.env/iu);

const readinessRoute = read("apps/web/app/api/ready/route.ts");
assert.match(readinessRoute, /getPublicMenuSnapshot/u);
assert.match(readinessRoute, /catalogLive/u);
assert.match(readinessRoute, /status: ok \? 200 : 503/u);
assert.match(readinessRoute, /createPublicOperationalStatus/u);
assert.doesNotMatch(readinessRoute, /@salora\/data/u);

for (const protectedDiagnostic of [
  "apps/web/app/api/runtime/inspect/route.ts",
  "apps/web/app/api/metrics/route.ts"
]) {
  const source = read(protectedDiagnostic);
  assert.match(source, /DIAGNOSTICS_TOKEN/u);
  assert.match(source, /x-salora-diagnostics-token/u);
  assert.doesNotMatch(source, /searchParams\.get\([^)]*(?:token|secret)/iu);
}

const backendIndex = read("packages/backend/src/index.ts");
assert.doesNotMatch(backendIndex, /p22c3c-readonly/u);

const packageJson = JSON.parse(read("package.json"));
assert.equal(packageJson.scripts["test:p22c3c-runtime-readonly-gate"], undefined);
assert.equal(
  packageJson.scripts["test:p22c3c-gate-retirement"],
  "node --experimental-strip-types scripts/p22c3c-gate-retirement.test.mjs"
);
assert.match(packageJson.scripts.test, /p22c3c-gate-retirement\.test\.mjs/u);
assert.doesNotMatch(packageJson.scripts.test, /p22c3c-runtime-readonly-gate\.test\.mjs/u);

const retirementReport = read("docs/p22c3c-gate-retirement-report.md");
for (const statement of [
  "NO PRODUCTION DATABASE WRITE PERFORMED",
  "NO PRODUCTION MIGRATION / DDL / DML PERFORMED",
  "POST-MERGE SECRET RETIREMENT CHECKLIST",
  "DEFER TO PR #2"
]) {
  assert.ok(retirementReport.includes(statement), `Missing retirement evidence statement: ${statement}`);
}

console.log("SALORA P22C-3C gate retirement verified:");
console.log("- four temporary diagnostic routes and their dedicated runtime helpers are absent");
console.log("- public operational responses are constructed from an explicit allowlist");
console.log("- serialized JSON excludes sensitive keys and values recursively");
console.log("- health is liveness-only and readiness remains truthful");
console.log("- remaining detailed runtime endpoints require the existing diagnostics header");
