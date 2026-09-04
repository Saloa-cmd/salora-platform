import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const route = read("apps/web/app/api/control-tower/p36-activate117/route.ts");
const service = read("apps/web/lib/server/p36Activate117.ts");
const review = read("apps/web/components/control-tower/P36ActivationReview.tsx");
const prep = read("apps/web/lib/server/p36ProductionDataPrep.ts");

assert.match(route, /z\.literal\("ACTIVATE117"\)/, "The activation token must be exact and server-validated.");
assert.match(route, /requireControlPermission\(request, "catalog:write"\)/, "The route must authenticate catalog writes.");
assert.match(route, /actor\.roles\.includes\("ADMIN"\)/, "Only Admin may activate and publish.");
assert.match(route, /invalidateMenuAuthorityCache\(\)/, "Publishing must invalidate the Menu Authority cache.");

assert.match(service, /withPrismaAuthContextTx/, "Activation and publication must share one database transaction.");
assert.match(service, /pg_advisory_xact_lock/, "Concurrent activation must be serialized.");
assert.match(service, /activated\.count !== 13/, "All 13 transitions must succeed or roll back.");
assert.match(service, /version: 2/, "The new immutable revision must be v2.");
assert.match(service, /publicationKey: PUBLICATION_KEY/, "Publication must use an idempotency key.");
assert.match(service, /\["WEB", "DIGITAL_MENU", "MOBILE"\]/, "All required channels must publish together.");
assert.match(service, /latest\.version !== 1/, "Revision v1 must be preserved as the rollback baseline.");
assert.match(service, /liveImageProducts\.length !== 117/, "The transaction must verify 117 live-image products.");
assert.match(service, /invalidPrices !== 0/, "The transaction must reject any invalid price.");
assert.doesNotMatch(service, /deleteMany|\.delete\(/, "Activation must not delete catalog history.");

assert.match(prep, /activationPerformed: false/, "Data prep must remain separate from activation.");
assert.match(review, /p36-production-data-prep/, "The Admin UI must expose the governed preparation step.");
assert.match(review, /p36-activate117/, "The Admin UI must expose the atomic activation step.");
assert.match(review, /approvalToken !== "ACTIVATE117"/, "The UI must require the explicit owner token.");

console.log("P36 ACTIVATE117 atomic gate checks passed.");
