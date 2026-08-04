import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const seed = read("prisma/seed.salora-menu.ts");
const publicMenu = read("apps/web/lib/server/publicMenu.ts");
const authority = read("apps/web/lib/server/menuAuthority.ts");
const aiHttp = read("apps/web/lib/server/aiHttp.ts");
const menuExperience = read("apps/web/components/menu/MenuExperience.tsx");
const mobileHome = read("apps/mobile/app/(tabs)/home.tsx");
const mobileAuthority = read("apps/mobile/src/services/menuAuthority.ts");
const backendContract = read("packages/backend/src/domains/menu-collections/revision-contract.ts");
const controlTower = read("apps/web/components/control-tower/MenuAuthorityStudio.tsx");
const controlTowerApi = read("apps/web/app/api/control-tower/menu-authority/route.ts");
const authorityApi = read("apps/web/app/api/v1/menu-authority/route.ts");
const readyRoute = read("apps/web/app/api/ready/route.ts");
const analyticsApi = read("apps/web/app/api/analytics/menu-event/route.ts");
const packageJson = JSON.parse(read("package.json"));

const menuBlock = seed.match(/const menu: MenuRow\[\] = \[([\s\S]*?)\n\];/u)?.[1];
assert.ok(menuBlock, "SALORA seed menu block is missing.");
const products = [...menuBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(null|\d+(?:\.\d+)?)/gmu)]
  .map((match) => ({ category: match[1], slug: match[2], price: match[5] === "null" ? null : Number(match[5]) }));
const drafts = products.filter((product) => product.price === null).map((product) => product.slug).sort();
const expectedDrafts = [
  "awar-qalb",
  "bahr",
  "berry-detox",
  "brazilian-lemonade",
  "khayal",
  "peanut-butter-latte",
  "pina-colada",
  "pistachio-espresso",
  "pistachio-spanish-latte",
  "protein-shake",
  "salora-cappuccino",
  "salora-latte",
  "strawberry-milkshake"
].sort();

assert.equal(products.length, 117, "P22 requires exactly 117 products.");
assert.equal(new Set(products.map((product) => product.slug)).size, 117, "P22 product slugs must be unique.");
assert.equal(products.filter((product) => product.price !== null).length, 104, "P22 requires exactly 104 ACTIVE-by-price products.");
assert.deepEqual(drafts, expectedDrafts, "P22 draft product set does not match the approved reference.");

assert.match(backendContract, /MENU_REVISION_CONTRACT_VERSION = 2/);
assert.match(authority, /status: "PUBLISHED"/);
assert.match(authority, /activeRevision/);
assert.match(authority, /SALORA_MENU_AUTHORITY_MODE/);
assert.doesNotMatch(publicMenu, /@salora\/data/);
assert.doesNotMatch(aiHttp, /@salora\/data/);
assert.doesNotMatch(menuExperience, /const arabicNames/);
assert.doesNotMatch(menuExperience, /function fallbackGroups/);
assert.match(mobileAuthority, /AsyncStorage/);
assert.match(mobileAuthority, /offline-cache/);
assert.doesNotMatch(mobileHome, /\["ماتشا", "قهوة مختصة", "حلويات", "مشروبات باردة"\]/);
assert.match(authorityApi, /x-salora-menu-revision/);
assert.match(readyRoute, /published-revision/);
assert.doesNotMatch(readyRoute, /menuSnapshot\.source === "database"/);
assert.match(controlTowerApi, /MenuCollectionDomainService/);
assert.match(controlTower, /Collections, revisions and publishing/);
assert.match(controlTower, /AbortController/);
assert.match(controlTower, /controller\.abort\(\)/);
assert.doesNotMatch(controlTower, /void load\(\)\.catch/);
assert.match(analyticsApi, /revisionId/);
assert.equal(typeof packageJson.scripts["test:menu-authority"], "string");
assert.ok(packageJson.scripts.test.includes("menu-authority-integration.test.mjs"));

console.log("SALORA P22 Menu Authority integration verified:");
console.log("- 117 unique products, 104 ACTIVE-by-price, 13 exact drafts");
console.log("- published MenuCollectionRevision contract v2 is authoritative");
console.log("- static web and AI menu fallbacks are removed");
console.log("- mobile revision cache and offline mode are present");
console.log("- Control Tower and revision-scoped analytics contracts are present");
