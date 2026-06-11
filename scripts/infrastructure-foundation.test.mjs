import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const envExample = readFileSync(join(root, ".env.example"), "utf8");
const requiredEnv = [
  "DATABASE_URL",
  "REDIS_URL",
  "QUEUE_PREFIX",
  "QUEUE_CONCURRENCY",
  "QUEUE_RETRY_LIMIT",
  "QUEUE_BACKOFF_MS",
  "DATABASE_QUERY_TIMEOUT_MS",
  "DATABASE_SLOW_QUERY_MS"
];

for (const key of requiredEnv) {
  assert.ok(envExample.includes(`${key}=`), `.env.example should include ${key}`);
}

const queueDefinitions = readFileSync(join(root, "packages/backend/src/jobs/queues/definitions.ts"), "utf8");
for (const queue of ["email", "notifications", "analytics", "ai-tasks", "media-processing"]) {
  assert.ok(queueDefinitions.includes(`"${queue}"`), `queue definitions should include ${queue}`);
}

const migration = readFileSync(join(root, "prisma/migrations/202605310001_auth_foundation/migration.sql"), "utf8");
assert.ok(migration.includes('CREATE TABLE "sessions"'), "database migration should preserve sessions table");

console.log("Infrastructure foundation tests passed.");
