import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hashPassword, signJwt, verifyJwt, verifyPassword } from "../apps/web/lib/server/auth/crypto.ts";
import { hasPermission, hasRole } from "../apps/web/lib/server/auth/rbac.ts";
import { canAccessControlTower } from "../apps/web/lib/server/auth/controlTowerAccess.ts";
import { publicRegistrationRoles } from "../apps/web/lib/server/auth/registration.ts";
import { InvalidCredentialsError, loginFailureStatus } from "../apps/web/lib/server/auth/errors.ts";
import { loginErrorMessage } from "../apps/web/lib/auth/loginError.ts";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(join(root, "prisma/migrations/202605310001_auth_foundation/migration.sql"), "utf8");
const authHttp = readFileSync(join(root, "apps/web/lib/server/auth/http.ts"), "utf8");

for (const required of ["model User", "model Role", "model UserRole", "model Session", "enum RoleName", "enum SessionStatus"]) {
  assert.ok(schema.includes(required), `schema should include ${required}`);
}

for (const required of ['CREATE TABLE "users"', 'CREATE TABLE "roles"', 'CREATE TABLE "user_roles"', 'CREATE TABLE "sessions"']) {
  assert.ok(migration.includes(required), `migration should include ${required}`);
}

const passwordHash = await hashPassword("CorrectHorseBatteryStaple!");
assert.ok(passwordHash.startsWith("$argon2"), "new password hashes should use Argon2");
assert.equal(await verifyPassword("CorrectHorseBatteryStaple!", passwordHash), true);
assert.equal(await verifyPassword("wrong-password", passwordHash), false);

assert.equal(authHttp.includes("roles:"), false, "public registration schema must not accept roles");
assert.ok(authHttp.includes("request.cookies.get(accessTokenCookieName)"), "authenticated APIs should accept the secure browser session cookie");

assert.deepEqual(publicRegistrationRoles(), ["CUSTOMER"], "public registration must create CUSTOMER only");

const jwtSecret = "test-access-secret-that-is-long-enough-32";
const token = signJwt({ sub: "user-1", email: "guest@salora.cafe", roles: ["ADMIN"], type: "access" }, jwtSecret, 60);
const payload = verifyJwt(token, jwtSecret);
assert.equal(payload.sub, "user-1");
assert.deepEqual(payload.roles, ["ADMIN"]);

assert.equal(hasRole(["ADMIN"], ["ADMIN"]), true);
assert.equal(hasPermission(["ADMIN"], "user:write"), true);
assert.equal(hasPermission(["CUSTOMER"], "user:write"), false);
assert.equal(canAccessControlTower(["STAFF"]), true);
assert.equal(canAccessControlTower(["MANAGER"]), true);
assert.equal(canAccessControlTower(["ADMIN"]), true);
assert.equal(canAccessControlTower(["CUSTOMER"]), false);

assert.equal(loginFailureStatus(new InvalidCredentialsError()), 401, "invalid credentials should remain a 401");
assert.equal(loginFailureStatus(new Error("DATABASE_URL is not configured")), 503, "auth infrastructure errors should be a 503");
assert.match(loginErrorMessage(401, "ar"), /البريد الإلكتروني أو كلمة المرور/);
assert.match(loginErrorMessage(429, "en"), /Too many sign-in attempts/);
assert.match(loginErrorMessage(503, "ar"), /لم يتم التحقق من بياناتك/);
assert.doesNotMatch(loginErrorMessage(503, "ar"), /غير صحيحة/);

console.log("Auth foundation tests passed.");
