import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const shell = read("apps/web/components/control-tower/ControlTowerShell.tsx");
const view = read("apps/web/components/control-tower/ControlTowerView.tsx");
const home = read("apps/web/components/control-tower/ControlTowerHome.tsx");
const catalog = read("apps/web/components/control-tower/CatalogWorkspace.tsx");

assert.ok(shell.includes("mobileDestinations") && shell.includes("salora-safe-bottom"), "Mobile task navigation must remain available.");
assert.ok(!shell.includes('name="bell"'), "A non-functional notification control must not be exposed.");
assert.ok(!view.includes("CapabilityCard") && !view.includes("ControlTowerCopilot"), "Technical capability scaffolding must stay out of primary task flows.");
assert.ok(view.includes("function SectionTabs"), "Composite Control Tower sections must use progressive-disclosure tabs.");
assert.ok(!view.includes("Governed settings") && !view.includes("Server controlled"), "Settings must not expose implementation copy in the primary workflow.");
assert.ok(home.includes('/api/control-tower/data-pulse') && home.includes("What do you want to do?"), "The home brief must use authoritative data and action-first copy.");
for (const marker of ["products", "media", "publish", "settings", "ProductReadinessWorkspace", "ProductMediaManager", "MenuAuthorityStudio"]) {
  assert.ok(catalog.includes(marker), `Catalog progressive-disclosure marker missing: ${marker}`);
}

console.log("SALORA unified Control Tower UX contract: PASS");
