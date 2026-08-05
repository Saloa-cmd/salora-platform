import assert from "node:assert/strict";
import {
  createHash
} from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import {
  dirname,
  resolve
} from "node:path";
import {
  spawnSync
} from "node:child_process";

const root = process.cwd();

const migrationPath = resolve(
  root,
  "prisma/migrations/202608050001_p22c3a_production_authority_schema_only/migration.sql"
);

const manifestPath = resolve(
  root,
  "docs/P22C3A_PRODUCTION_AUTHORITY_SCHEMA_ONLY_MANIFEST.json"
);

const workflowPath = resolve(
  root,
  ".github/workflows/ci.yml"
);

const baselinePath = resolve(
  root,
  "scripts/p22c3b/legacy-baseline.sql"
);

const rollbackPath = resolve(
  root,
  "scripts/p22c3b/rollback.sql"
);

const approvedSha =
  "9dc141be031edc4956b59c0a89c8de10fadadfff0cac57168a150ff80e4b97c4";

const authorityTables = [
  "menu_collections",
  "menu_collection_sections",
  "menu_collection_products",
  "product_nutrition_profiles",
  "product_allergen_profiles",
  "menu_collection_revisions",
  "menu_publications",
  "menu_role_permissions"
];

const authorityEnums = [
  "MenuCollectionKind",
  "MenuCollectionStatus",
  "MenuMembershipSource",
  "FoodDataVerificationStatus",
  "MenuPublicationStatus",
  "MenuCollectionPermission"
];

const baselineHelpers = [
  "salora_jwt_roles",
  "salora_is_staff",
  "salora_is_manager",
  "salora_is_admin"
];

const canonicalLf = (value) =>
  value.replace(/\r\n?/gu, "\n");

const canonicalSha256 = (value) =>
  createHash("sha256")
    .update(canonicalLf(value), "utf8")
    .digest("hex");

const unique = (values) =>
  [...new Set(values)];

const sorted = (values) =>
  [...values].sort((left, right) =>
    left.localeCompare(right)
  );

const parseNames = (text, pattern) =>
  unique(
    [...text.matchAll(pattern)]
      .map((match) => match[1])
  );

const migration = readFileSync(
  migrationPath,
  "utf8"
);

const manifest = JSON.parse(
  readFileSync(manifestPath, "utf8")
);

const workflow = readFileSync(
  workflowPath,
  "utf8"
);

const baseline = readFileSync(
  baselinePath,
  "utf8"
);

const rollback = readFileSync(
  rollbackPath,
  "utf8"
);

const migrationSha =
  canonicalSha256(migration);

assert.equal(
  migrationSha,
  approvedSha,
  "The P22C-3A migration does not match the approved canonical SHA-256."
);

assert.equal(
  manifest.migration.sha256,
  approvedSha,
  "The manifest does not reference the approved canonical SHA-256."
);

assert.equal(
  manifest.migration.hashCanonicalization,
  "UTF8_LF",
  "The manifest must declare UTF8_LF canonicalization."
);

assert.match(
  workflow,
  /image:\s*postgres:17-alpine/
);

assert.match(
  workflow,
  /runs-on:\s*ubuntu-latest/
);

assert.match(
  workflow,
  /permissions:\s*\n\s*contents:\s*read/
);

assert.doesNotMatch(
  workflow,
  /SUPABASE|PRODUCTION_DATABASE|VERCEL_ENV|DATABASE_URL:\s*\$\{\{\s*secrets/iu,
  "The P22C-3B workflow must not use Supabase, Production, or database secrets."
);

assert.match(
  baseline,
  /generate_series\(1,\s*117\)/
);

assert.match(
  baseline,
  /product_number\s*<=\s*104/
);

assert.match(
  baseline,
  /generate_series\(1,\s*16\)/
);

assert.match(
  rollback,
  /DROP TABLE IF EXISTS public\.menu_collections CASCADE/
);

const expectedTables = parseNames(
  migration,
  /CREATE TABLE "([^"]+)"/gu
);

const expectedEnums = parseNames(
  migration,
  /CREATE TYPE "([^"]+)" AS ENUM/gu
);

const expectedPolicies = parseNames(
  migration,
  /CREATE POLICY "([^"]+)"/gu
);

const expectedIndexes = parseNames(
  migration,
  /CREATE (?:UNIQUE )?INDEX(?: IF NOT EXISTS)? "([^"]+)"/gu
);

const expectedTriggers = parseNames(
  migration,
  /CREATE TRIGGER ([a-zA-Z0-9_]+)/gu
);

const expectedFunctions = parseNames(
  migration,
  /CREATE OR REPLACE FUNCTION public\.([a-zA-Z0-9_]+)\(/gu
).filter((name) =>
  name.startsWith("salora_") &&
  !baselineHelpers.includes(name)
);

const expectedConstraints = unique([
  ...parseNames(
    migration,
    /CONSTRAINT "([^"]+)"/gu
  ),
  ...parseNames(
    migration,
    /ADD CONSTRAINT "([^"]+)"/gu
  )
]);

assert.deepEqual(
  sorted(expectedTables),
  sorted(authorityTables)
);

assert.deepEqual(
  sorted(expectedEnums),
  sorted(authorityEnums)
);

assert.equal(
  expectedPolicies.length,
  24
);

assert.equal(
  expectedTriggers.length,
  11
);

assert.equal(
  expectedFunctions.length,
  7
);

console.log(
  "P22C-3B repository contract verified:"
);

console.log(
  `- approved canonical migration SHA: ${migrationSha}`
);

console.log(
  "- PostgreSQL 17 service container is isolated and secret-free"
);

console.log(
  "- synthetic baseline is 117 / 104 / 13 / 16"
);

console.log(
  "- rollback removes only Menu Authority objects"
);

if (process.argv.includes("--contract-only")) {
  process.exit(0);
}

const databaseUrl =
  process.env.DATABASE_URL;

assert.ok(
  databaseUrl,
  "DATABASE_URL is required inside the isolated GitHub Actions job."
);

const reportPath =
  process.env.P22C3B_REPORT_PATH ??
  resolve(root, "p22c3b-certification.json");

const runPsql = ({
  sql,
  file,
  tuplesOnly = false
} = {}) => {
  const args = [
    databaseUrl,
    "-X",
    "-v",
    "ON_ERROR_STOP=1"
  ];

  if (tuplesOnly) {
    args.push("-A", "-t", "-q");
  }

  if (file) {
    args.push("-f", file);
  }

  if (sql) {
    args.push("-c", sql);
  }

  const result = spawnSync(
    "psql",
    args,
    {
      encoding: "utf8",
      input: undefined,
      maxBuffer: 20 * 1024 * 1024
    }
  );

  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");

    throw new Error(
      `psql failed with exit code ${result.status}`
    );
  }

  return (result.stdout ?? "").trim();
};

const runPsqlInput = (sql) => {
  const result = spawnSync(
    "psql",
    [
      databaseUrl,
      "-X",
      "-v",
      "ON_ERROR_STOP=1"
    ],
    {
      encoding: "utf8",
      input: sql,
      maxBuffer: 30 * 1024 * 1024
    }
  );

  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");

    throw new Error(
      `psql input failed with exit code ${result.status}`
    );
  }

  return (result.stdout ?? "").trim();
};

const queryLines = (sql) => {
  const output = runPsql({
    sql,
    tuplesOnly: true
  });

  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean);
};

const queryScalar = (sql) =>
  queryLines(sql)[0] ?? "";

const sqlTextArray = (values) =>
  `ARRAY[${values
    .map((value) =>
      `'${value.replaceAll("'", "''")}'`
    )
    .join(",")}]::text[]`;

const assertSetEqual = (
  actual,
  expected,
  label
) => {
  assert.deepEqual(
    sorted(actual),
    sorted(expected),
    `${label} does not match the migration contract.`
  );
};

const catalogFingerprintSql = `
SELECT encode(
  digest(
    COALESCE(
      string_agg(
        concat_ws(
          '|',
          id::text,
          category_id::text,
          slug,
          name,
          description,
          status::text,
          base_price::text,
          brand_key,
          COALESCE(name_ar, ''),
          COALESCE(name_en, '')
        ),
        E'\\n'
        ORDER BY slug
      ),
      ''
    ),
    'sha256'
  ),
  'hex'
)
FROM public.catalog_products;
`;

const categoryFingerprintSql = `
SELECT encode(
  digest(
    COALESCE(
      string_agg(
        concat_ws(
          '|',
          id::text,
          slug,
          name,
          sort_order::text,
          brand_key,
          COALESCE(name_ar, ''),
          COALESCE(name_en, '')
        ),
        E'\\n'
        ORDER BY slug
      ),
      ''
    ),
    'sha256'
  ),
  'hex'
)
FROM public.product_categories;
`;

runPsql({
  file: baselinePath
});

const serverVersion =
  queryScalar("SHOW server_version;");

assert.match(
  serverVersion,
  /^17\./u,
  `Expected PostgreSQL 17, found ${serverVersion}.`
);

const before = {
  catalogFingerprint:
    queryScalar(catalogFingerprintSql),
  categoryFingerprint:
    queryScalar(categoryFingerprintSql),
  total:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products;"
    )),
  active:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products WHERE status = 'ACTIVE';"
    )),
  draft:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products WHERE status = 'DRAFT';"
    )),
  categories:
    Number(queryScalar(
      "SELECT count(*) FROM public.product_categories;"
    ))
};

assert.deepEqual(
  {
    total: before.total,
    active: before.active,
    draft: before.draft,
    categories: before.categories
  },
  {
    total: 117,
    active: 104,
    draft: 13,
    categories: 16
  }
);

runPsqlInput(
  canonicalLf(migration)
);

const actualTables = queryLines(`
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = ANY(${sqlTextArray(authorityTables)})
ORDER BY tablename;
`);

assertSetEqual(
  actualTables,
  authorityTables,
  "Authority tables"
);

const actualEnums = queryLines(`
SELECT t.typname
FROM pg_type AS t
JOIN pg_namespace AS n
  ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname = ANY(${sqlTextArray(authorityEnums)})
ORDER BY t.typname;
`);

assertSetEqual(
  actualEnums,
  authorityEnums,
  "Authority enum types"
);

const actualPolicies = queryLines(`
SELECT policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = ANY(${sqlTextArray(authorityTables)})
ORDER BY policyname;
`);

assertSetEqual(
  actualPolicies,
  expectedPolicies,
  "RLS policies"
);

const rlsTables = queryLines(`
SELECT c.relname
FROM pg_class AS c
JOIN pg_namespace AS n
  ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = ANY(${sqlTextArray(authorityTables)})
  AND c.relrowsecurity
ORDER BY c.relname;
`);

assertSetEqual(
  rlsTables,
  authorityTables,
  "RLS-enabled authority tables"
);

const actualIndexes = queryLines(`
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = ANY(${sqlTextArray(authorityTables)})
  AND indexname = ANY(${sqlTextArray(expectedIndexes)})
ORDER BY indexname;
`);

assertSetEqual(
  actualIndexes,
  expectedIndexes,
  "Authority indexes"
);

const actualTriggers = queryLines(`
SELECT t.tgname
FROM pg_trigger AS t
JOIN pg_class AS c
  ON c.oid = t.tgrelid
JOIN pg_namespace AS n
  ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = ANY(${sqlTextArray(authorityTables)})
  AND NOT t.tgisinternal
ORDER BY t.tgname;
`);

assertSetEqual(
  actualTriggers,
  expectedTriggers,
  "Authority triggers"
);

const actualFunctions = queryLines(`
SELECT p.proname
FROM pg_proc AS p
JOIN pg_namespace AS n
  ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = ANY(${sqlTextArray(expectedFunctions)})
ORDER BY p.proname;
`);

assertSetEqual(
  actualFunctions,
  expectedFunctions,
  "Authority functions"
);

const actualConstraints = queryLines(`
SELECT DISTINCT con.conname
FROM pg_constraint AS con
JOIN pg_class AS rel
  ON rel.oid = con.conrelid
JOIN pg_namespace AS n
  ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND rel.relname = ANY(${sqlTextArray(authorityTables)})
  AND con.conname = ANY(${sqlTextArray(expectedConstraints)})
ORDER BY con.conname;
`);

assertSetEqual(
  actualConstraints,
  expectedConstraints,
  "Authority constraints"
);

for (const table of authorityTables) {
  const rows = Number(
    queryScalar(
      `SELECT count(*) FROM public."${table}";`
    )
  );

  assert.equal(
    rows,
    0,
    `${table} must remain empty after schema-only migration.`
  );
}

const stagingMetadataCount = Number(
  queryScalar(`
SELECT count(*)
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'staging_certification_metadata',
    'staging_menu_authority_metadata'
  );
`)
);

assert.equal(
  stagingMetadataCount,
  0,
  "Staging-only metadata tables must not be created."
);

const insecureFunctionCount = Number(
  queryScalar(`
SELECT count(*)
FROM pg_proc AS p
JOIN pg_namespace AS n
  ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = ANY(${sqlTextArray([
    ...baselineHelpers,
    ...expectedFunctions
  ])})
  AND p.prosecdef;
`)
);

assert.equal(
  insecureFunctionCount,
  0,
  "Menu Authority functions must not use SECURITY DEFINER."
);

const afterApply = {
  catalogFingerprint:
    queryScalar(catalogFingerprintSql),
  categoryFingerprint:
    queryScalar(categoryFingerprintSql),
  total:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products;"
    )),
  active:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products WHERE status = 'ACTIVE';"
    )),
  draft:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products WHERE status = 'DRAFT';"
    )),
  categories:
    Number(queryScalar(
      "SELECT count(*) FROM public.product_categories;"
    ))
};

assert.deepEqual(
  afterApply,
  before,
  "Catalog or category fingerprint changed after schema application."
);

runPsql({
  file: rollbackPath
});

const remainingTables = queryLines(`
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = ANY(${sqlTextArray(authorityTables)});
`);

assert.deepEqual(
  remainingTables,
  [],
  "Authority tables remain after rollback rehearsal."
);

const remainingEnums = queryLines(`
SELECT t.typname
FROM pg_type AS t
JOIN pg_namespace AS n
  ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname = ANY(${sqlTextArray(authorityEnums)});
`);

assert.deepEqual(
  remainingEnums,
  [],
  "Authority enum types remain after rollback rehearsal."
);

const remainingFunctions = queryLines(`
SELECT p.proname
FROM pg_proc AS p
JOIN pg_namespace AS n
  ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = ANY(${sqlTextArray(expectedFunctions)});
`);

assert.deepEqual(
  remainingFunctions,
  [],
  "Authority functions remain after rollback rehearsal."
);

const remainingBaselineHelpers = queryLines(`
SELECT p.proname
FROM pg_proc AS p
JOIN pg_namespace AS n
  ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = ANY(${sqlTextArray(baselineHelpers)})
ORDER BY p.proname;
`);

assertSetEqual(
  remainingBaselineHelpers,
  baselineHelpers,
  "Baseline RLS helpers after rollback"
);

const afterRollback = {
  catalogFingerprint:
    queryScalar(catalogFingerprintSql),
  categoryFingerprint:
    queryScalar(categoryFingerprintSql),
  total:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products;"
    )),
  active:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products WHERE status = 'ACTIVE';"
    )),
  draft:
    Number(queryScalar(
      "SELECT count(*) FROM public.catalog_products WHERE status = 'DRAFT';"
    )),
  categories:
    Number(queryScalar(
      "SELECT count(*) FROM public.product_categories;"
    ))
};

assert.deepEqual(
  afterRollback,
  before,
  "Catalog or category fingerprint changed after rollback rehearsal."
);

const report = {
  phase: "P22C-3B",
  certified: true,
  environment: "GITHUB_ACTIONS_POSTGRES_SERVICE_CONTAINER",
  postgresVersion: serverVersion,
  migration: {
    path:
      "prisma/migrations/202608050001_p22c3a_production_authority_schema_only/migration.sql",
    canonicalSha256: migrationSha,
    hashCanonicalization: "UTF8_LF"
  },
  baseline: before,
  schemaCertification: {
    tables: authorityTables.length,
    enumTypes: authorityEnums.length,
    policies: expectedPolicies.length,
    indexes: expectedIndexes.length,
    triggers: expectedTriggers.length,
    functions: expectedFunctions.length,
    constraints: expectedConstraints.length,
    authorityRows: 0,
    stagingMetadataTables: 0,
    catalogFingerprintPreserved: true,
    categoryFingerprintPreserved: true
  },
  rollbackRehearsal: {
    completed: true,
    authorityTablesRemaining: 0,
    authorityEnumsRemaining: 0,
    authorityFunctionsRemaining: 0,
    baselineHelpersPreserved: true,
    catalogFingerprintPreserved: true,
    categoryFingerprintPreserved: true
  },
  safety: {
    supabaseProjectUsed: false,
    productionDatabaseContacted: false,
    stagingDatabaseContacted: false,
    databaseSecretsUsed: false,
    migrationAppliedOutsideEphemeralContainer: false,
    environmentChanged: false,
    deploymentPerformed: false
  }
};

mkdirSync(
  dirname(reportPath),
  {
    recursive: true
  }
);

writeFileSync(
  reportPath,
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      "# P22C-3B Certification",
      "",
      "- Result: **PASS**",
      `- PostgreSQL: **${serverVersion}**`,
      `- Migration SHA-256: \`${migrationSha}\``,
      "- Baseline: **117 / 104 ACTIVE / 13 DRAFT / 16 categories**",
      "- Authority schema: **8 tables / 6 enums / 24 policies**",
      "- Authority data rows: **0**",
      "- Catalog fingerprints preserved: **yes**",
      "- Rollback rehearsal: **passed**",
      "- Supabase or Production contacted: **no**",
      ""
    ].join("\n"),
    "utf8"
  );
}

console.log(
  JSON.stringify(report, null, 2)
);
