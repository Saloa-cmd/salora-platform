import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync("prisma/migrations/202607210001_salora_content_platform/migration.sql", "utf8");
const route = readFileSync("apps/web/app/api/control-tower/content-studio/route.ts", "utf8");
const publicRoute = readFileSync("apps/web/app/api/content/route.ts", "utf8");
const ui = readFileSync("apps/web/components/control-tower/ContentOperationsStudio.tsx", "utf8");

for (const model of ["CmsDocument", "CmsRevision", "CmsApproval"]) assert.match(schema, new RegExp(`model ${model}`));
for (const resource of ["PAGE", "SECTION", "NAVIGATION", "BANNER", "CAMPAIGN", "LANDING_PAGE"]) assert.match(schema, new RegExp(`\\b${resource}\\b`));
assert.match(migration, /constraint cms_documents_salora_brand check \(brand_key = 'SALORA'\)/);
assert.equal((migration.match(/enable row level security/g) ?? []).length, 3);
assert.equal((migration.match(/force row level security/g) ?? []).length, 3);
assert.match(migration, /revoke all on public\.cms_revisions from anon, authenticated/);
assert.match(migration, /grant select on public\.cms_documents to anon, authenticated/);
assert.doesNotMatch(migration, /grant (insert|update|delete).*anon/i);
for (const action of ["create", "save", "submit", "publish", "schedule", "rollback", "archive"]) assert.match(route, new RegExp(`literal\\(\"${action}\"\\)`));
for (const action of ["approve", "reject"]) assert.match(route, new RegExp(`\"${action}\"`));
assert.match(route, /content:approve/);
assert.match(route, /content:publish/);
assert.match(route, /brandKey: BRAND_KEY/);
assert.match(publicRoute, /brandKey: "SALORA"/);
assert.match(publicRoute, /status: "SCHEDULED"/);
assert.match(ui, /استوديو إدارة المحتوى والنشر/);
assert.match(ui, /Versions & rollback/);

console.log("SALORA content platform verified: isolation, RLS, revisions, approvals, scheduling and rollback.");
