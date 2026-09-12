import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { breakfastCategory, breakfastGroups, breakfastMenu, breakfastService, isBreakfastProductInGroup } from "../packages/data/src/breakfast.ts";

assert.equal(breakfastCategory.slug, "breakfast");
assert.equal(breakfastMenu.length, 22, "Breakfast launch must contain exactly 22 approved items.");
assert.deepEqual(
  Object.fromEntries(breakfastGroups.map((group) => [group.key, group.count])),
  { platters: 3, sandwiches: 6, juices: 5, tea: 8 }
);
assert.deepEqual(
  {
    status: breakfastService.status,
    timeZone: breakfastService.timeZone,
    dailyStart: breakfastService.dailyStart,
    dailyEnd: breakfastService.dailyEnd
  },
  { status: "AVAILABLE", timeZone: "Asia/Muscat", dailyStart: "08:00", dailyEnd: "12:00" }
);
assert.equal(breakfastService.hoursAr, "يوميًا · 8 صباحًا — 12 ظهرًا");
assert.equal(breakfastService.hoursEn, "Daily · 8 AM — 12 PM");

const slugs = breakfastMenu.map((item) => item.slug);
assert.equal(new Set(slugs).size, slugs.length, "Breakfast slugs must be unique.");

for (const group of breakfastGroups) {
  const matchingItems = breakfastMenu.filter((item) =>
    isBreakfastProductInGroup(["breakfast", `breakfast-${item.group}`], group.key)
  );
  assert.equal(matchingItems.length, group.count, `${group.key} filter count must match the menu group contract.`);
}
assert.ok(isBreakfastProductInGroup(["breakfast"], null), "The all-breakfast view must not require a subgroup tag.");

const expectedPrices = {
  "english-breakfast": 3.9,
  "arabic-breakfast": 3.5,
  "iranian-breakfast": 3.7,
  "bandari-sausage-sandwich": 1.3,
  "bulgarian-sausage-sandwich": 1.4,
  "turkey-jambon-sandwich": 1.3,
  "egg-sandwich": 0.8,
  "egg-cheese-sandwich": 1,
  "egg-cheese-oman-chips-sandwich": 1.2,
  "breakfast-fresh-orange-juice": 1.4,
  "breakfast-fresh-mango-juice": 1.5,
  "breakfast-lemonade": 1.2,
  "breakfast-sweet-sour": 1.4,
  "breakfast-mojito": 1.5,
  "breakfast-black-tea": 0.6,
  "breakfast-green-mint-tea": 0.8,
  "breakfast-karak-tea": 0.7,
  "breakfast-moroccan-tea": 1,
  "breakfast-hibiscus-tea": 0.9,
  "breakfast-chamomile-tea": 0.9,
  "breakfast-fruit-tea": 1,
  "breakfast-saffron-tea": 1.2
};

for (const item of breakfastMenu) {
  assert.equal(item.price, expectedPrices[item.slug], `Unexpected OMR price for ${item.slug}.`);
  assert.ok(item.nameAr.trim() && item.nameEn.trim(), `${item.slug} must be bilingual.`);
  assert.ok(item.descriptionAr.trim() && item.descriptionEn.trim(), `${item.slug} must have bilingual descriptions.`);
  assert.doesNotMatch(`${item.nameEn} ${item.descriptionEn}`, /\bpork\b/i, `${item.slug} must not introduce pork.`);
  assert.match(item.asset, /^\/products\/breakfast\/[a-z0-9-]+\.webp$/);
  assert.ok(existsSync(resolve("apps/web/public", item.asset.slice(1))), `Missing product image for ${item.slug}.`);
}

const experience = readFileSync("apps/web/components/menu/MenuExperience.tsx", "utf8");
assert.match(experience, /id="breakfast-menu"/);
assert.match(experience, /breakfastMediaBySlug\[product\.id\]/);
assert.match(experience, /ريوق سالورا/);
assert.match(experience, /SALORA Breakfast/);
assert.match(experience, /src="\/products\/breakfast\/breakfast-hero\.webp"/);
assert.match(experience, /tag !== "breakfast"/);
assert.match(experience, /!tag\.startsWith\("breakfast-"\)/);
assert.match(experience, /ريوق صباحي/);
assert.match(experience, /const heroSubtitle = breakfastProducts\.length/);
assert.match(experience, /isBreakfastProductInGroup\(product\.tags, activeBreakfastGroup\)/);
assert.match(experience, /aria-pressed=\{activeGroup === group\.key\}/);
assert.match(experience, /onExplore\(group\.key\)/);
assert.match(experience, /value\.split\("\|"\)/);
assert.match(experience, /line\.modifiers\.map\(\(modifier\) => optionLabel\(language, modifier\.optionName\)\)/);
assert.match(experience, /breakfastService\.availabilityAr/);
assert.match(experience, /breakfastService\.hoursEn/);

const homeExperience = readFileSync("apps/web/components/home/PremiumHomeExperience.tsx", "utf8");
assert.match(homeExperience, /breakfastMediaBySlug\[product\.id\]/);
assert.match(homeExperience, /يومياً · 8 صباحاً — 12:30 بعد منتصف الليل/);
assert.match(homeExperience, /Daily · 8 AM — 12:30 AM/);
assert.match(homeExperience, /const hasBreakfast = featuredProducts\.some/);
assert.match(homeExperience, /breakfastService\.availabilityEn/);
assert.match(homeExperience, /breakfastService\.hoursAr/);

const seeder = readFileSync("scripts/seed-salora-breakfast.ts", "utf8");
assert.match(seeder, /SALORA_BREAKFAST_STATUS \?\? "DRAFT"/);
assert.match(seeder, /Menu Authority revision/);
assert.doesNotMatch(seeder, /menuCollectionRevision\.(?:create|update)|menuPublication\.(?:create|update)/);

console.log("SALORA breakfast menu contract verified: 22 items, bilingual copy, exact prices, isolated assets and draft-safe seed.");
