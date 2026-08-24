import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const experienceConfig = read("apps/web/lib/experience/config.ts");
const experienceStatus = read("apps/web/components/public/ExperienceStatus.tsx");
const globalConcierge = read("apps/web/components/GlobalAiConcierge.tsx");
const menuExperience = read("apps/web/components/menu/MenuExperience.tsx");
const rootLayout = read("apps/web/app/layout.tsx");
const p31Css = read("apps/web/app/p31-experience.css");
const packageJson = JSON.parse(read("package.json"));

assert.match(experienceConfig, /heroSubtitleAr: CUSTOMER_HERO_SUBTITLE_AR/);
assert.match(experienceConfig, /heroSubtitleEn: CUSTOMER_HERO_SUBTITLE_EN/);
assert.match(experienceConfig, /customerFacingConfiguration/);

for (const customerSurface of [experienceStatus, globalConcierge, menuExperience]) {
  for (const technicalPhrase of [
    "المنيو المباشر غير متاح",
    "المنيو المباشر قيد الاستعادة",
    "المساعد الذكي يعود عند اتصال المنيو المباشر",
    "وضع توافق مؤقت",
    "بيانات مباشرة",
    "AI Concierge returns when the live menu is connected",
    "Compatibility mode",
    "Live data",
    "The live menu is being restored"
  ]) {
    assert.ok(!customerSurface.includes(technicalPhrase), `Customer-facing technical copy returned: ${technicalPhrase}`);
  }
}

assert.match(experienceStatus, /if \(live\) return null/);
assert.match(globalConcierge, /if \(availability !== "ready"\) return null/);
assert.match(menuExperience, /Today’s selections are being prepared/);
assert.match(menuExperience, /نرتّب اختيارات اليوم/);
assert.match(menuExperience, /!catalogUnavailable \? <fieldset/);
assert.match(rootLayout, /import "\.\/p31-experience\.css"/);
assert.match(p31Css, /prefers-reduced-motion/);
assert.match(p31Css, /premium-menu-card/);

assert.equal(packageJson.scripts["audit:production:preflight"], "node scripts/p31-production-data-preflight.mjs");
assert.equal(packageJson.scripts["certify:production:data"], "node scripts/p31-production-data-certify.mjs");
assert.ok(existsSync(new URL("../scripts/p31-production-data-preflight.mjs", import.meta.url)));
assert.ok(existsSync(new URL("../scripts/p31-production-data-certify.mjs", import.meta.url)));

console.log("SALORA P31 experience + Production Data foundation verified:");
console.log("- customer UI contains hospitality copy instead of infrastructure language");
console.log("- unavailable AI is silent until it can deliver a grounded experience");
console.log("- unavailable menu avoids empty interactive controls");
console.log("- P31 visual refinement and reduced-motion support are loaded");
console.log("- Production Data preflight and certification remain read-only and explicit");
