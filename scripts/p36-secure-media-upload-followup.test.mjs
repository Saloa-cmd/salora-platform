import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const route = read("apps/web/app/api/control-tower/p36-production-data-prep/route.ts");
const service = read("apps/web/lib/server/p36ProductionDataPrep.ts");
const integrity = read("apps/web/lib/server/mediaIntegrity.ts");
const manifest = read("apps/web/lib/control-tower/p36ActivationManifest.ts");

for (const marker of ['runtime = "nodejs"', "maxDuration = 60", 'requireControlPermission(request, "catalog:write")', 'roles.includes("ADMIN")', 'z.literal("prepare")', "p36ProductionDataPrepApproval.token"]) {
  assert.ok(route.includes(marker), `Secure data-prep route marker missing: ${marker}`);
}
assert.ok(!route.includes("export async function GET"), "Production data prep must not be triggerable with GET.");

for (const marker of ['VERCEL_ENV !== "production"', "VERCEL_PROJECT_PRODUCTION_URL", 'EXPECTED_PRODUCTION_PROJECT_REF = "xikqnzvfnquiqyybkyvw"', "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", '"x-upsert": "false"', "verifyProductMediaBytes", "verifyProductMedia({", "pg_advisory_xact_lock", "withPrismaAuthContextTx", "P36 Product identity gate", "P36 price conflict detected", "Unexpected live ProductImage conflict", "post-write readiness verification failed", "auditLog.createMany", "activityLog.createMany"]) {
  assert.ok(service.includes(marker), `Production data-prep safety marker missing: ${marker}`);
}

assert.ok(service.includes('/products/p36-media-candidates/'), "Media may only be sourced from the approved deployment asset directory.");
assert.ok(service.includes('status: "PUBLISHED"') && service.includes('status: "ARCHIVED"'), "Approved media must publish while seed placeholders are archived, not deleted.");
assert.ok(service.includes('activationPerformed: false') && service.includes('revisionPublished: false'), "Data prep must not activate products or publish a revision.");
assert.ok(!/status:\s*"ACTIVE"/.test(service), "The data-prep service must never activate a product.");
assert.ok(!/menu(CollectionRevision|Publication)\.(create|update|delete)/.test(service), "The data-prep service must never mutate Menu Authority revisions.");

for (const marker of ["createHash(\"sha256\")", "Media dimensions", "Media file size", "configured Supabase origin", 'redirect: "error"']) {
  assert.ok(integrity.includes(marker), `Byte-level media integrity marker missing: ${marker}`);
}

const candidates = [...manifest.matchAll(/imagePath: "([^"]+)", imageSha256: "([a-f0-9]{64})"/g)];
assert.equal(candidates.length, 13, "The Production upload allowlist must contain exactly 13 approved candidates.");
assert.ok(manifest.includes('token: "AUTHORIZE-P36-PRODUCTION-DATA-PREP"'), "Owner Production data-prep authorization is missing.");
assert.ok(manifest.includes("productionUploadAuthorized: true"), "Owner media upload authorization is missing.");
assert.ok(manifest.includes("activationAuthorized: false") && manifest.includes("revisionPublishAuthorized: false"), "Activation and Revision v2 must remain blocked.");

for (const [, publicPath, expectedHash] of candidates) {
  const bytes = readFileSync(join(root, "apps/web/public", publicPath));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedHash, `Approved media checksum mismatch: ${publicPath}`);
}

console.log("P36 secure media upload follow-up: PASS — production binding, authorization, byte verification, atomic DML, audit, idempotency, and activation separation verified.");
