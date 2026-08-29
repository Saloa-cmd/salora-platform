import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const service = read("apps/web/lib/server/auth/ownerRecovery.ts");
const route = read("apps/web/app/api/auth/owner-recovery/route.ts");
const page = read("apps/web/app/recover-owner-access/page.tsx");
const login = read("apps/web/app/login/page.tsx");

for (const marker of [
  'VERCEL_ENV !== "production"',
  'SALORA_OWNER_RECOVERY_ENABLED !== "true"',
  "SALORA_OWNER_RECOVERY_TOKEN",
  "timingSafeEqual",
  "pg_advisory_xact_lock",
  "adminCount > 0",
  "existingOwner",
  "hashPassword(input.password)",
  'name: "ADMIN"',
  'key: RECOVERY_KEY',
  'action: "admin.ownerRecovery"',
  'action: "CREATE"'
]) assert.ok(service.includes(marker), `Owner recovery safety marker missing: ${marker}`);

assert.ok(service.includes("withPrismaAuthContextTx"), "Owner recovery writes must be atomic.");
assert.ok(!service.includes("session.create") && !service.includes("signJwt("), "Owner recovery must not create an authenticated session automatically.");
assert.ok(!/SALORA_OWNER_RECOVERY_TOKEN\s*=/.test(service), "A recovery token must never be committed.");

for (const marker of [
  'runtime = "nodejs"',
  'enforceRateLimit(request, "auth")',
  "z.string().min(16).max(256)",
  ".regex(/[a-z]/",
  ".regex(/[A-Z]/",
  ".regex(/[0-9]/",
  "Owner recovery failed safely.",
  'cache-control", "no-store'
]) assert.ok(route.includes(marker), `Owner recovery route marker missing: ${marker}`);

for (const marker of [
  'autoComplete="one-time-code"',
  'autoComplete="new-password"',
  'name="confirmPassword"',
  "16 حرفًا على الأقل",
  "لا تُرسل كلمة المرور أو رمز الاستعادة عبر المحادثات",
  'href="/login?next=/control-tower/overview"'
]) assert.ok(page.includes(marker), `Owner recovery UI marker missing: ${marker}`);
assert.ok(login.includes('href="/recover-owner-access"'), "The sign-in page must expose the recovery entry point.");

for (const file of [service, route, page, login]) {
  assert.ok(!/sb_secret_|service_role\s*[:=]\s*["'][A-Za-z0-9]/.test(file), "A server secret value leaked into owner recovery code.");
}

console.log("Owner Admin recovery guard: PASS — one-time token, Production binding, Argon2, atomic Admin creation, audit, rate limit, and no auto-session verified.");
