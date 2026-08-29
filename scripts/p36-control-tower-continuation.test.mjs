import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const workspace = read("apps/web/components/control-tower/ProductReadinessWorkspace.tsx");
const palette = read("apps/web/components/control-tower/ControlTowerCommandPalette.tsx");
const experience = read("apps/web/components/control-tower/ExperienceDesignStudio.tsx");
const experienceRoute = read("apps/web/app/api/control-tower/experience/route.ts");
const publishCenter = read("apps/web/components/control-tower/MenuAuthorityStudio.tsx");
const aiGuard = read("apps/web/lib/server/simpleLaunchControl.ts");
const productRoute = read("apps/web/app/api/control-tower/simple-launch/products/route.ts");
const imageRoute = read("apps/web/app/api/control-tower/simple-launch/product-images/route.ts");
const mediaIntegrity = read("apps/web/lib/server/mediaIntegrity.ts");
const manifestSource = read("apps/web/lib/control-tower/p36ActivationManifest.ts");

for (const marker of ["Catalog Command Center", "Missing price", "Missing media", "Availability", "AI assistant", "grid md:hidden", "min-h-11"]) {
  assert.ok(workspace.includes(marker), `P36 Catalog Command Center marker missing: ${marker}`);
}
assert.ok(workspace.includes("offset=0") && workspace.includes("offset=100"), "Catalog loading must continue beyond the 100-row API limit.");
assert.ok(workspace.includes("activationCandidates.length ?"), "Activate-ready control must be hidden when no candidate exists.");
assert.ok(!workspace.includes("activateReadyDrafts") && workspace.includes("Review activation gate"), "The UI must not bypass the ACTIVATE117 gate with sequential activation writes.");
assert.ok(workspace.includes("salora.catalog.view"), "Operator view preference must be persisted.");
assert.ok(palette.includes("Price") && palette.includes("Media") && palette.includes("Availability") && palette.includes("Preview"), "Command Palette 2.0 product actions are incomplete.");

for (const marker of ["publishedPage", '"split"', "PUBLISHED · READ ONLY", "ExperienceRenderer"]) {
  assert.ok(experience.includes(marker), `Split Preview marker missing: ${marker}`);
}
assert.ok(experienceRoute.includes("getPublishedExperienceConfiguration") && experienceRoute.includes("adaptExperienceConfigurationV1"), "Published preview must reuse the existing production renderer adapter.");

for (const step of ["Draft", "Validate", "Preview", "Review", "Approve", "Publish", "Verify", "Rollback"]) {
  assert.ok(publishCenter.includes(step), `Publish Center step missing: ${step}`);
}
assert.ok(publishCenter.includes("environment parity required"), "Publish Center must fail closed when the bound environment has no authority records.");

for (const operation of ["translation", "alt_text", "readiness"]) assert.ok(aiGuard.includes(operation), `Review-only AI operation missing: ${operation}`);
for (const forbidden of ["Do not mutate", "Do not save or approve media", "Do not save or publish"]) assert.ok(aiGuard.includes(forbidden), `AI restriction missing: ${forbidden}`);
assert.ok(aiGuard.includes("SALORA_PREVIEW_DATA_ISOLATED") && aiGuard.includes("Preview mutations are disabled"), "Preview writes must fail closed until an isolated data binding is certified.");
assert.ok(aiGuard.includes('responseError(error.message, id, 409)'), "An expected Preview mutation lock must not become a 5xx response.");
assert.ok(productRoute.includes("SALORA_ACTIVATE117_APPROVED") && productRoute.includes("ACTIVATE117 production gate"), "The 13 P36 activations must fail closed before the explicit gate.");
for (const marker of ["configured Supabase origin", "sha256", "Media dimensions", "redirect: \"error\""]) assert.ok(mediaIntegrity.includes(marker), `Media integrity guard missing: ${marker}`);
assert.ok(!imageRoute.includes("external/${input.productSlug}") && imageRoute.includes("verifyProductMedia"), "ProductImage creation must reject unverifiable external URLs.");

const candidates = [...manifestSource.matchAll(/imagePath: "([^"]+)", imageSha256: "([a-f0-9]{64})"/g)];
assert.equal(candidates.length, 13, "P36 activation manifest must contain exactly 13 media candidates.");
assert.equal((manifestSource.match(/approvedPrice:/g) ?? []).length, 14, "P36 manifest must contain 13 approved prices plus its type definition.");
assert.ok(manifestSource.includes('source: "SALORA owner-approved 13-item pricing table"'), "Price authority source must be explicit.");
assert.ok(manifestSource.includes("productionBaselinePrice: 0"), "The 0.000 → approved price baseline must remain explicit.");
assert.ok(manifestSource.includes('status: "APPROVED"') && manifestSource.includes('mimeType: "image/webp"'), "Approved media metadata must be explicit.");
assert.ok(manifestSource.includes('token: "APPROVE13MEDIA"') && manifestSource.includes("productionUploadAuthorized: false"), "Media approval evidence must not become Production write authority.");
assert.ok(manifestSource.includes('"awar-qalb": "244d1e2f-e205-4e80-97d1-a9c7cae43c9e"'), "The manifest must use the read-only Production Product IDs.");
assert.ok(!manifestSource.includes("40618f76-dfb7-4576-9386-f973346b6a92"), "A staging Product ID leaked into the Production activation evidence.");
for (const neutralAsset of ["awar-qalb-v2.webp", "khayal-v2.webp", "protein-shake-v2.webp"]) {
  assert.ok(manifestSource.includes(neutralAsset), `Neutral media replacement is not selected: ${neutralAsset}`);
}

for (const [, publicPath, expectedHash] of candidates) {
  const bytes = readFileSync(join(root, "apps/web/public", publicPath));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedHash, `Checksum mismatch: ${publicPath}`);
}

for (const clientFile of [workspace, palette, experience, publishCenter]) {
  assert.ok(!/service_role|DATABASE_URL|DIRECT_URL|SUPABASE_SECRET_KEY/.test(clientFile), "A server secret name leaked into a P36 client component.");
}

console.log("P36 continuation guard: PASS — 13 prices, 13 media checksums, Operator UX, Split Preview, Publish Center, and AI restrictions verified.");
