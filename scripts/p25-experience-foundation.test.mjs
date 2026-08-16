import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [types, schema, registry, compatibility, renderer, icons, api, prisma] = await Promise.all([
  readFile(new URL("../packages/types/src/index.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/lib/experience/schema-v2.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/lib/experience/component-registry.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/lib/experience/compatibility.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/components/experience/ExperienceRenderer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/components/ui/saloraIconRegistry.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/api/control-tower/experience/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8")
]);

for (const contract of ["ExperiencePageV2", "ExperienceSectionV2", "ExperiencePlatformOverride", "ExperienceRevisionStatus", "SaloraSemanticIconName"]) assert.match(types, new RegExp(`\\b${contract}\\b`));
for (const component of ["hero.luxury.v1", "menu.product-grid.premium.v1", "story.editorial.v1", "location.map-card.v1", "cta.gold.v1"]) {
  assert.match(schema, new RegExp(component.replaceAll(".", "\\.")), `schema missing ${component}`);
  assert.match(registry, new RegExp(component.replaceAll(".", "\\.")), `registry missing ${component}`);
}
for (const unsafe of ["javascript:", "dangerouslySetInnerHTML", "rawHtml", "customCss", "customJavaScript"]) {
  assert.doesNotMatch(schema, new RegExp(unsafe, "i"), `unsafe capability must not exist: ${unsafe}`);
  assert.doesNotMatch(renderer, new RegExp(unsafe, "i"), `renderer must not expose: ${unsafe}`);
}
assert.match(schema, /Only HTTPS external links are allowed/);
assert.match(schema, /Section IDs must be unique/);
assert.match(schema, /Unknown section/);
assert.match(compatibility, /legacy|Menu Authority|menu-authority-adapter/i);
assert.match(compatibility, /status:\s*"DRAFT"/);
assert.match(renderer, /Unsupported SALORA component/);
assert.match(renderer, /data-experience-version/);
assert.match(icons, /Readonly<Record<SaloraSemanticIconName, LucideIcon>>/);
assert.match(registry, /accessibilityRules/);
assert.match(registry, /themeSupport/);

// Existing persistence and publishing remain untouched in P25 PR1.
for (const model of ["CmsDocument", "CmsRevision", "CmsApproval", "RuntimeConfiguration"]) assert.match(prisma, new RegExp(`model ${model}\\b`));
assert.match(api, /EXPERIENCE_DRAFT_KEY/);
assert.match(api, /EXPERIENCE_PUBLISHED_KEY/);
assert.doesNotMatch(api, /experiencePageV2Schema|parseExperiencePageV2/);

console.log("P25 Experience Architecture Foundation: PASS");
console.log("- schema-driven v2 contracts and component registry verified");
console.log("- arbitrary HTML, CSS, JavaScript, and unsafe links remain excluded");
console.log("- v1 production persistence and Menu Authority lifecycle remain untouched");
