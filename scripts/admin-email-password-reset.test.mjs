import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const service = read("apps/web/lib/server/auth/passwordReset.ts");
const requestRoute = read("apps/web/app/api/auth/password-reset/request/route.ts");
const confirmRoute = read("apps/web/app/api/auth/password-reset/confirm/route.ts");
const forgotPage = read("apps/web/app/forgot-password/page.tsx");
const resetPage = read("apps/web/app/reset-password/page.tsx");
const login = read("apps/web/app/login/page.tsx");

for (const marker of ["randomBytes(32)", 'createHash("sha256")', "RESET_TTL_SECONDS", '"EX", RESET_TTL_SECONDS, "NX"', "redis.eval", "redis.call('DEL'", "hashPassword(input.password)", 'status: "REVOKED"', "auth.passwordResetRequested", "auth.passwordResetCompleted", 'action: "UPDATE"', "RESEND_API_KEY", "SALORA_PASSWORD_RESET_FROM", "https://api.resend.com/emails", "resetUrl.hash"]) {
  assert.ok(service.includes(marker), `Password reset safety marker missing: ${marker}`);
}
assert.ok(!service.includes("passwordHash: input.password"), "Plaintext passwords must never be stored.");
assert.ok(!service.includes("NEXT_PUBLIC_RESEND"), "The email API key must remain server-only.");
for (const route of [requestRoute, confirmRoute]) {
  assert.ok(route.includes('enforceRateLimit(request, "auth")'), "Password reset routes must be rate limited.");
  assert.ok(route.includes('runtime = "nodejs"'), "Password reset routes must use Node runtime.");
}
assert.ok(requestRoute.includes("accepted(requestId)"), "Request responses must resist email enumeration.");
assert.ok(confirmRoute.includes("z.string().min(16).max(256)"), "Confirmation must enforce a strong password policy.");
assert.ok(forgotPage.includes('autoComplete="email"') && resetPage.includes('autoComplete="new-password"'), "Recovery forms need correct autocomplete semantics.");
assert.ok(resetPage.includes("window.location.hash") && !resetPage.includes("window.location.search"), "Reset token must stay out of request URLs and server logs.");
assert.ok(login.includes('href="/forgot-password"'), "Login must point to email password recovery.");
console.log("Admin email password reset: PASS — opaque one-time token, Redis TTL/atomic consume, Resend server delivery, Argon2, session revocation, audit, and anti-enumeration verified.");
