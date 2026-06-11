import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function walk(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  const files = [];
  for (const entry of readdirSync(absoluteDir)) {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = path.relative(root, absolutePath).replaceAll("\\", "/");
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "generated"].includes(entry)) continue;
      files.push(...walk(relativePath));
    } else if (relativePath.endsWith(".ts")) {
      files.push(relativePath);
    }
  }
  return files;
}

const backendLimiter = read("packages/backend/src/cache/rateLimit.ts");
assert(backendLimiter.includes("connectRedis"), "Distributed limiter must use Redis runtime.");
assert(backendLimiter.includes("RateLimitExceededError"), "Distributed limiter must expose typed 429 error.");
assert(!backendLimiter.includes("new Map"), "Distributed limiter must not use process-local Map storage.");
assert(!backendLimiter.includes("setInterval"), "Distributed limiter must not depend on process-local timers.");

const governance = read("packages/backend/src/ai/governance/governance.ts");
assert(governance.includes("assertDistributedRateLimit"), "AI governance must use distributed Redis limiter.");
assert(!governance.includes("requestCounters"), "AI governance must not retain process-local counters.");
assert(!governance.includes("new Map"), "AI governance must not use process-local Map.");

const webLimiter = read("apps/web/lib/server/rateLimit.ts");
for (const policy of ["auth", "ai", "orders", "whatsapp", "stripe", "controlTower"]) {
  assert(webLimiter.includes(`${policy}:`), `Missing ${policy} rate-limit policy.`);
}
assert(webLimiter.includes("retry-after"), "429 responses must include retry-after header.");

const requiredFiles = [
  "apps/web/lib/server/aiHttp.ts",
  "apps/web/lib/server/simpleLaunchControl.ts",
  "apps/web/app/api/auth/login/route.ts",
  "apps/web/app/api/auth/register/route.ts",
  "apps/web/app/api/auth/refresh/route.ts",
  "apps/web/app/api/orders/route.ts",
  "apps/web/app/api/payments/create-intent/route.ts",
  "apps/web/app/api/payments/confirm/route.ts",
  "apps/web/app/api/payments/refund/route.ts",
  "apps/web/app/api/payments/webhook/route.ts",
  "apps/web/app/api/whatsapp/send/route.ts",
  "apps/web/app/api/whatsapp/webhook/route.ts",
  "apps/web/app/api/channels/whatsapp/webhook/route.ts"
];

for (const file of requiredFiles) {
  const content = read(file);
  assert(content.includes("enforceRateLimit"), `Missing enforceRateLimit in ${file}.`);
  assert(content.includes("rateLimitResponse") || file.endsWith("simpleLaunchControl.ts"), `Missing rateLimitResponse in ${file}.`);
}

for (const file of walk("apps/web/app/api/control-tower")) {
  if (!file.endsWith("route.ts")) continue;
  const content = read(file);
  assert(content.includes("requireControlPermission"), `Control Tower route must pass through central rate-limited permission guard: ${file}`);
}

if (failures.length > 0) {
  console.error("Rate limit validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Rate limit validation passed.");
console.log("Redis distributed limiter protects Auth, AI, Orders, WhatsApp, Stripe, and Control Tower.");
