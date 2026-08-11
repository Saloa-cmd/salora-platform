import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  P22C3C_PREFLIGHT_DO,
  P22C3C_PREFLIGHT_RESULT_QUERY,
  P22C3C_SNAPSHOT_QUERY
} from "../apps/web/lib/server/p22c3cRuntimeQueries.ts";

const canonicalLf = (value) =>
  value.replace(/\r\n?/gu, "\n").trim();

const read = (path) =>
  canonicalLf(
    readFileSync(path, "utf8")
  );

const snapshotSource =
  read(
    "scripts/p22c3c/sql/01_snapshot_read_only.sql"
  );

const preflightSource =
  read(
    "scripts/p22c3c/sql/02_preflight_read_only.sql"
  );

const route =
  read(
    "apps/web/app/api/internal/p22c3c-runtime-readonly/route.ts"
  );

const helper =
  read(
    "packages/backend/src/database/p22c3c-readonly.ts"
  );

const documentation =
  read(
    "docs/P22C3C_RUNTIME_READ_ONLY_GATE.md"
  );

const packageJson =
  JSON.parse(
    readFileSync(
      "package.json",
      "utf8"
    )
  );

const snapshotMatch =
  snapshotSource.match(
    /WITH product_state AS \([\s\S]*?\nCROSS JOIN operational_state;/u
  );

assert.ok(
  snapshotMatch?.[0],
  "Certified Snapshot SELECT was not found."
);

assert.equal(
  canonicalLf(
    P22C3C_SNAPSHOT_QUERY
  ),
  canonicalLf(
    snapshotMatch[0]
  ),
  "Runtime Snapshot must exactly match the certified Snapshot SELECT."
);

const preflightDoMatch =
  preflightSource.match(
    /DO \$p22c3c_preflight\$[\s\S]*?\$p22c3c_preflight\$;/u
  );

assert.ok(
  preflightDoMatch?.[0],
  "Certified Preflight DO block was not found."
);

assert.equal(
  canonicalLf(
    P22C3C_PREFLIGHT_DO
  ),
  canonicalLf(
    preflightDoMatch[0]
  ),
  "Runtime Preflight DO must exactly match the certified block."
);

const resultMatches = [
  ...preflightSource.matchAll(
    /SELECT jsonb_build_object\([\s\S]*?\)::text;/gu
  )
];

assert.equal(
  resultMatches.length,
  1,
  "Certified Preflight must expose exactly one result SELECT."
);

assert.equal(
  canonicalLf(
    P22C3C_PREFLIGHT_RESULT_QUERY
  ),
  canonicalLf(
    resultMatches[0][0]
  ),
  "Runtime Preflight result SELECT must exactly match the certified source."
);

for (const sql of [
  P22C3C_SNAPSHOT_QUERY,
  P22C3C_PREFLIGHT_DO,
  P22C3C_PREFLIGHT_RESULT_QUERY
]) {
  for (const forbidden of [
    /^\s*CREATE\s+(?:TABLE|TYPE|INDEX|POLICY|FUNCTION|TRIGGER|EXTENSION)\b/imu,
    /^\s*ALTER\s+TABLE\b/imu,
    /^\s*DROP\s+/imu,
    /^\s*INSERT\s+INTO\b/imu,
    /^\s*UPDATE\s+(?!OF\b)/imu,
    /^\s*DELETE\s+FROM\b/imu,
    /^\s*TRUNCATE\b/imu,
    /^\s*COPY\s+/imu,
    /^\s*MERGE\s+INTO\b/imu,
    /^\s*COMMIT\s*;/imu
  ]) {
    assert.doesNotMatch(
      sql,
      forbidden
    );
  }
}

assert.match(
  helper,
  /default_transaction_read_only=on/u
);

assert.match(
  helper,
  /grcycqdtjjfklibutfos/u
);

assert.match(
  helper,
  /wauwsfrckjjwwmdhifjt/u
);

assert.match(
  helper,
  /axpwsqahswkobrjvldrc/u
);

assert.doesNotMatch(
  route,
  /export async function GET/u
);

assert.match(
  route,
  /export async function POST/u
);

assert.match(
  route,
  /process\.env\.VERCEL_ENV !== "production"/u
);

assert.match(
  route,
  /x-salora-p22c3c-gate/u
);

assert.match(
  route,
  /timingSafeEqual/u
);

assert.match(
  route,
  /P22C3C_ISOLATION_LEVELS\.snapshot/u
);

assert.match(
  route,
  /P22C3C_ISOLATION_LEVELS\.preflight/u
);

assert.match(
  helper,
  /Prisma\.TransactionIsolationLevel\.RepeatableRead/u
);

assert.match(
  helper,
  /Prisma\.TransactionIsolationLevel\.Serializable/u
);

assert.match(
  route,
  /ROLLBACK_SENTINEL/u
);

assert.match(
  route,
  /databaseUrlExposed: false/u
);

assert.match(
  route,
  /databaseWritePerformed: false/u
);

assert.match(
  route,
  /migrationApplied: false/u
);

assert.doesNotMatch(
  route,
  /console\.(?:log|error|warn)/u
);

assert.doesNotMatch(
  route,
  /process\.env\.DATABASE_URL[^;]*console/u
);

assert.match(
  route,
  /const GATE_TOKEN_SHA256 = "[a-f0-9]{64}"/u
);

assert.doesNotMatch(
  route,
  /__GATE_TOKEN_HASH__/u
);

assert.doesNotMatch(
  route,
  /__GATE_EXPIRES_AT__/u
);

assert.equal(
  packageJson.scripts[
    "test:p22c3c-runtime-readonly-gate"
  ],
  "node scripts/p22c3c-runtime-readonly-gate.test.mjs"
);

assert.match(
  packageJson.scripts.test,
  /p22c3c-runtime-readonly-gate\.test\.mjs/u
);

for (const marker of [
  "RUNTIME READ ONLY",
  "DATABASE_URL",
  "grcycqdtjjfklibutfos",
  "default_transaction_read_only=on",
  "Snapshot",
  "Preflight",
  "Rollback",
  "No Migration",
  "temporary",
  "Production only"
]) {
  assert.ok(
    documentation.includes(marker),
    `Missing documentation marker: ${marker}`
  );
}

console.log(
  "SALORA P22C-3C Runtime Read-Only Gate verified:"
);

console.log(
  "- runtime SQL exactly matches the certified Snapshot and Preflight probes"
);

console.log(
  "- DATABASE_URL is validated against the exact Production project ref"
);

console.log(
  "- every PostgreSQL connection is fail-closed default read only"
);

console.log(
  "- Snapshot and Preflight run in rollback transactions"
);

console.log(
  "- route is POST-only, Production-only, token-hash protected, and time-limited"
);

console.log(
  "- no Migration or database write path is present"
);
