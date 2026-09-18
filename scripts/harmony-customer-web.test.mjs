import assert from "node:assert/strict";import fs from "node:fs";
const page=fs.readFileSync("apps/web/app/rewards/page.tsx","utf8"),api=fs.readFileSync("apps/web/app/api/rewards/me/route.ts","utf8"),login=fs.readFileSync("apps/web/app/login/page.tsx","utf8");
assert.match(page,/Harmony Rewards/);assert.match(page,/\/api\/rewards\/me/);assert.match(page,/رصيد Harmony/);assert.match(page,/آخر حركات النقاط/);
assert.match(api,/currentAuthPayload/);assert.match(api,/withPrismaAuthContext/);assert.match(api,/userId:actor\.sub/);assert.match(api,/customerProfile\.findUnique/);assert.match(api,/isActive:true/);
assert.match(login,/requested === "\/rewards"/);console.log("Harmony customer web portal checks passed.");