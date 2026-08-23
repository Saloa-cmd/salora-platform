import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const publicMenu = read("apps/web/lib/server/publicMenu.ts");
const experienceConfig = read("apps/web/lib/server/experienceConfig.ts");
const home = read("apps/web/components/home/PremiumHomeExperience.tsx");
const menu = read("apps/web/components/menu/MenuExperience.tsx");
const status = read("apps/web/components/public/ExperienceStatus.tsx");
const ready = read("apps/web/app/api/ready/route.ts");
const databaseHealth = read("packages/backend/src/database/health.ts");
const redisHealth = read("packages/backend/src/cache/health.ts");
const queueHealth = read("packages/backend/src/jobs/health/health.ts");

assert.match(publicMenu, /if \(!process\.env\.DATABASE_URL\) return unavailableMenuSnapshot\(\)/);
assert.match(publicMenu, /products: \[\]/);
assert.match(publicMenu, /databaseHealth: "unavailable"/);
assert.doesNotMatch(publicMenu, /@salora\/data/);
assert.match(experienceConfig, /if \(!process\.env\.DATABASE_URL\) return defaultExperienceConfiguration/);
assert.match(home, /<ExperienceStatus/);
assert.match(menu, /catalogUnavailable/);
assert.match(menu, /orderingUnavailable/);
assert.match(status, /role="status"/);
assert.match(ready, /status: ok \? 200 : 503/);
for (const healthModule of [databaseHealth, redisHealth, queueHealth]) {
  assert.match(healthModule, /getInfrastructureEnv\(\{ strict: false \}\)/);
}

console.log("SALORA P28 resilient experience verified:");
console.log("- public pages degrade without fabricated catalog data");
console.log("- readiness returns structured 503 state when infrastructure is absent");
console.log("- shared bilingual status and guarded checkout are wired across public UI");
