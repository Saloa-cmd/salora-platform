import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function walk(relativeDir, predicate = () => true) {
  const absoluteDir = path.join(root, relativeDir);
  const files = [];

  for (const entry of readdirSync(absoluteDir)) {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = path.relative(root, absolutePath).replaceAll("\\", "/");
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      if (["node_modules", ".next", "generated"].includes(entry)) continue;
      files.push(...walk(relativePath, predicate));
      continue;
    }

    if (predicate(relativePath)) files.push(relativePath);
  }

  return files;
}

function assertNoPattern(relativeDir, pattern, label) {
  for (const file of walk(relativeDir, (filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"))) {
    const content = read(file);
    if (pattern.test(content)) {
      fail(`${label}: ${file}`);
    }
  }
}

const rlsPath = "packages/backend/src/database/rls-context.ts";
const domainRepoPath = "packages/backend/src/domains/control-tower/repository.ts";
const exportedRepoPath = "packages/backend/src/repositories/control-tower.ts";
const simpleLaunchPath = "apps/web/lib/server/simpleLaunchControl.ts";
const authRepoPath = "apps/web/lib/server/auth/prismaRepository.ts";

assert(existsSync(path.join(root, rlsPath)), "Missing RLS context implementation.");
assert(existsSync(path.join(root, domainRepoPath)), "Missing Control Tower repository implementation.");
assert(existsSync(path.join(root, exportedRepoPath)), "Missing exported repository layer under packages/backend/src/repositories.");

const rls = read(rlsPath);
assert(rls.includes("$transaction"), "RLS context must be transaction-scoped.");
assert(rls.includes("set_config('request.jwt.claims'"), "RLS context must set JWT claims for policies.");
assert(rls.includes("set_config('app.current_user_id'"), "RLS context must set app.current_user_id.");
assert(rls.includes("assertAuthContext"), "RLS context must fail closed when context is missing.");
assert(!rls.includes("$executeRawUnsafe"), "RLS context must not use unsafe raw SQL.");
assert(!/SET\s+LOCAL\s+app\./i.test(rls), "RLS context must use parameterized set_config, not interpolated SET LOCAL statements.");

const domainRepo = read(domainRepoPath);
assert(domainRepo.includes("withPrismaAuthContext"), "Control Tower repository must wrap Prisma operations with RLS context.");
assert(domainRepo.includes("createControlTowerRepository"), "Control Tower repository factory is missing.");

const simpleLaunch = read(simpleLaunchPath);
assert(!/export\s+function\s+prisma\s*\(/.test(simpleLaunch), "simpleLaunchControl must not export prisma().");
assert(!simpleLaunch.includes("getPrismaClient"), "simpleLaunchControl must not import/use getPrismaClient.");
assert(simpleLaunch.includes("createControlTowerRepository"), "simpleLaunchControl audit/activity fallback must use repository.");

const authRepo = read(authRepoPath);
assert(authRepo.includes("withPrismaAuthContext"), "Production auth repository must execute under RLS context.");
assert(!authRepo.includes("getPrismaClient"), "Production auth repository must not depend on getPrismaClient.");

assertNoPattern("apps/web/app/api", /\bprisma\s*\(|\bgetPrismaClient\b/, "Direct Prisma access found in API route");
assertNoPattern("apps/web/lib/server", /\bprisma\s*\(|\bgetPrismaClient\b/, "Direct Prisma access found in server helper");

const controlTowerRoutes = walk("apps/web/app/api/control-tower", (filePath) => filePath.endsWith("route.ts"));
assert(controlTowerRoutes.length >= 10, "Expected Control Tower route inventory to be present.");

for (const route of controlTowerRoutes) {
  const content = read(route);
  assert(!/\bprisma\s*\(|\bgetPrismaClient\b/.test(content), `Control Tower route bypasses repository/RLS: ${route}`);
}

if (failures.length > 0) {
  console.error("Security remediation validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Security remediation validation passed.");
console.log(`Validated ${controlTowerRoutes.length} Control Tower routes with no direct Prisma access.`);
console.log("RLS runtime context is transaction-scoped, fail-closed, and parameterized.");
