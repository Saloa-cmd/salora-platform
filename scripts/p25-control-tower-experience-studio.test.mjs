import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const registry = read("apps/web/lib/control-tower/registry.ts");
const shell = read("apps/web/components/control-tower/ControlTowerShell.tsx");
const studio = read("apps/web/components/control-tower/ExperienceDesignStudio.tsx");
const experienceRoute = read("apps/web/app/api/control-tower/experience/route.ts");
const searchRoute = read("apps/web/app/api/control-tower/search/route.ts");
const navigation = read("apps/web/lib/server/controlTowerNavigation.ts");

for (const id of ["overview", "experience", "menu", "orders", "customers", "marketing", "ai", "analytics", "operations", "settings"]) assert.match(registry, new RegExp(`id: "${id}"`), `Missing canonical IA section ${id}`);
assert.equal((registry.match(/id: "/g) ?? []).length, 10, "Control Tower must expose exactly ten canonical workspaces");
assert.match(navigation, /import "server-only"/);
assert.match(navigation, /hasPermission/);
assert.match(shell, /visibleSections/);
assert.match(shell, /ControlTowerCommandPalette/);
assert.match(shell, /SaloraIcon/);

assert.match(studio, /ExperienceRenderer/);
assert.match(studio, /SALORA_COMPONENT_REGISTRY/);
assert.match(studio, /DRAFT ONLY · PR3/);
assert.doesNotMatch(studio, /Publish now|Restore & publish|action: "publish"|action: "rollback"/);
assert.match(experienceRoute, /requireControlPermission\(request, "content:read"\)/);
assert.match(experienceRoute, /requireControlPermission\(request, "content:write"\)/);
assert.match(experienceRoute, /status !== "DRAFT"/);
assert.match(experienceRoute, /expectedVersion/);
assert.match(experienceRoute, /updateMany/);
assert.match(experienceRoute, /updated\.count !== 1/);
assert.doesNotMatch(experienceRoute, /system:write|revalidatePath|EXPERIENCE_PUBLISHED_KEY|literal\("publish"\)|literal\("rollback"\)/);

assert.match(searchRoute, /take: 6/);
assert.match(searchRoute, /results\.slice\(0, 15\)/);
assert.match(searchRoute, /hasPermission/);
assert.doesNotMatch(searchRoute, /\$queryRaw|\$executeRaw|service_role|DATABASE_URL/);
assert.ok(!existsSync("apps/web/app/api/admin/query/route.ts"));
assert.ok(!existsSync("apps/web/app/api/admin/table/[table]/route.ts"));

for (const doc of ["p25-pr3-architecture.md", "information-architecture.md", "experience-studio.md", "domain-operations.md", "rbac-and-audit.md", "persistence-assessment.md"]) assert.ok(existsSync(`docs/control-tower/${doc}`), `Missing ${doc}`);

console.log("P25 PR3 Control Tower Experience Studio contract: PASS");
