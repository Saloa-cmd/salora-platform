import { createHash, timingSafeEqual } from "node:crypto";
import {
  createP22C3CReadOnlyPrismaClient,
  P22C3C_ISOLATION_LEVELS,
  P22C3C_PRODUCTION_PROJECT_REF
} from "@salora/backend";
import {
  P22C3C_PREFLIGHT_DO,
  P22C3C_PREFLIGHT_RESULT_QUERY,
  P22C3C_SNAPSHOT_QUERY
} from "@/lib/server/p22c3cRuntimeQueries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const GATE_TOKEN_SHA256 = "6b9b9665672f96d304be1df13891a08a336c02e6be4b27cd38b342b57a498e13";
const GATE_EXPIRES_AT = "2026-08-11T14:35:36.0191542Z";
const ROLLBACK_SENTINEL = "__P22C3C_RUNTIME_INTENTIONAL_ROLLBACK__";

let consumed = false;

type JsonRecord = Record<string, unknown>;

type SnapshotShape = {
  phase: string;
  mode: string;
  serverVersion: string;
  serverVersionNum: number;
  transactionReadOnly: string;
  catalog: {
    products: {
      total: number;
      active: number;
      draft: number;
      paused: number;
      archived: number;
      fingerprint: string;
    };
    categories: {
      total: number;
      fingerprint: string;
      slugs: string[];
    };
  };
  authorityTables: Record<string, boolean>;
  authorityEnums: Record<string, boolean>;
  helperFunctions: Record<string, boolean>;
  migrationLedgers: Record<string, boolean>;
  stagingOnlyTables: Record<string, boolean>;
  operations: {
    transactionsOver10Minutes: number;
    inRecovery: boolean;
  };
};

type PreflightShape = {
  phase: string;
  mode: string;
  result: string;
  serverVersion: string;
  transactionReadOnly: string;
  productAuthority: string;
  categories: number;
  authoritySchemaAbsent: boolean;
  stagingMetadataAbsent: boolean;
};

function hiddenResponse(status = 404) {
  return Response.json(
    {
      phase: "P22C-3C",
      result: "NOT_AVAILABLE"
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

function safeFailure(code: string, status = 503) {
  return Response.json(
    {
      phase: "P22C-3C",
      result: "FAIL_SAFE",
      code,
      databaseUrlExposed: false,
      migrationApplied: false,
      databaseWritePerformed: false
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

function gateTokenMatches(value: string) {
  const actual = createHash("sha256").update(value, "utf8").digest();
  const expected = Buffer.from(GATE_TOKEN_SHA256, "hex");

  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}

function singleJsonText<T>(
  rows: Array<JsonRecord>,
  label: string
): T {
  if (rows.length !== 1) {
    throw new Error(`${label}_ROW_COUNT`);
  }

  const raw = Object.values(rows[0] ?? {})[0];

  if (typeof raw !== "string") {
    throw new Error(`${label}_NOT_TEXT`);
  }

  return JSON.parse(raw) as T;
}

function allValues(
  value: Record<string, boolean>,
  expected: boolean
) {
  return Object.values(value).every(
    (entry) => entry === expected
  );
}

export async function POST(request: Request) {
  if (
    process.env.VERCEL !== "1" ||
    process.env.VERCEL_ENV !== "production" ||
    (
      process.env.VERCEL_TARGET_ENV &&
      process.env.VERCEL_TARGET_ENV !== "production"
    )
  ) {
    return hiddenResponse();
  }

  if (
    Date.now() >
    Date.parse(GATE_EXPIRES_AT)
  ) {
    return hiddenResponse(410);
  }

  if (consumed) {
    return hiddenResponse(410);
  }

  const token =
    request.headers.get(
      "x-salora-p22c3c-gate"
    ) ?? "";

  if (
    !token ||
    !gateTokenMatches(token)
  ) {
    return hiddenResponse();
  }

  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    return safeFailure(
      "DATABASE_URL_MISSING"
    );
  }

  let prisma;

  try {
    prisma =
      createP22C3CReadOnlyPrismaClient(
        databaseUrl
      );
  } catch {
    return safeFailure(
      "PRODUCTION_DATABASE_IDENTITY_REJECTED",
      409
    );
  }

  let snapshot:
    | SnapshotShape
    | undefined;

  let preflight:
    | PreflightShape
    | undefined;

  try {
    await prisma.$connect();

    const identity =
      await prisma.$queryRawUnsafe<
        Array<{
          server_version_num: number;
          server_version: string;
          default_transaction_read_only: string;
          in_recovery: boolean;
        }>
      >(`
        SELECT
          current_setting(
            'server_version_num'
          )::integer AS server_version_num,
          current_setting(
            'server_version'
          ) AS server_version,
          current_setting(
            'default_transaction_read_only'
          ) AS default_transaction_read_only,
          pg_is_in_recovery() AS in_recovery;
      `);

    const databaseIdentity =
      identity[0];

    if (
      !databaseIdentity ||
      databaseIdentity.default_transaction_read_only !== "on" ||
      databaseIdentity.server_version_num < 170000 ||
      databaseIdentity.in_recovery
    ) {
      return safeFailure(
        "READ_ONLY_DATABASE_IDENTITY_GUARD_FAILED",
        409
      );
    }

    try {
      await prisma.$transaction(
        async (tx) => {
          const settings =
            await tx.$queryRawUnsafe<
              Array<{
                transaction_read_only: string;
                default_transaction_read_only: string;
              }>
            >(`
              SELECT
                current_setting(
                  'transaction_read_only'
                ) AS transaction_read_only,
                current_setting(
                  'default_transaction_read_only'
                ) AS default_transaction_read_only;
            `);

          if (
            settings[0]?.transaction_read_only !== "on" ||
            settings[0]?.default_transaction_read_only !== "on"
          ) {
            throw new Error(
              "SNAPSHOT_READ_ONLY_GUARD_FAILED"
            );
          }

          const rows =
            await tx.$queryRawUnsafe<
              Array<JsonRecord>
            >(
              P22C3C_SNAPSHOT_QUERY
            );

          snapshot =
            singleJsonText<SnapshotShape>(
              rows,
              "SNAPSHOT"
            );

          throw new Error(
            ROLLBACK_SENTINEL
          );
        },
        {
          isolationLevel:
            P22C3C_ISOLATION_LEVELS.snapshot,
          maxWait: 10000,
          timeout: 60000
        }
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes(
          ROLLBACK_SENTINEL
        )
      ) {
        throw error;
      }
    }

    if (!snapshot) {
      return safeFailure(
        "SNAPSHOT_RESULT_MISSING"
      );
    }

    if (
      snapshot.phase !== "P22C-3C" ||
      snapshot.mode !==
        "PRODUCTION_SNAPSHOT_READ_ONLY" ||
      snapshot.transactionReadOnly !== "on" ||
      snapshot.catalog.products.total !== 117 ||
      snapshot.catalog.products.active !== 104 ||
      snapshot.catalog.products.draft !== 13 ||
      snapshot.catalog.products.paused !== 0 ||
      snapshot.catalog.products.archived !== 0 ||
      snapshot.catalog.categories.total !== 16 ||
      snapshot.operations.inRecovery ||
      !allValues(
        snapshot.authorityTables,
        false
      ) ||
      !allValues(
        snapshot.authorityEnums,
        false
      ) ||
      !allValues(
        snapshot.helperFunctions,
        true
      ) ||
      !allValues(
        snapshot.stagingOnlyTables,
        false
      )
    ) {
      return safeFailure(
        "SNAPSHOT_ASSERTION_FAILED",
        409
      );
    }

    try {
      await prisma.$transaction(
        async (tx) => {
          const settings =
            await tx.$queryRawUnsafe<
              Array<{
                transaction_read_only: string;
                default_transaction_read_only: string;
              }>
            >(`
              SELECT
                current_setting(
                  'transaction_read_only'
                ) AS transaction_read_only,
                current_setting(
                  'default_transaction_read_only'
                ) AS default_transaction_read_only;
            `);

          if (
            settings[0]?.transaction_read_only !== "on" ||
            settings[0]?.default_transaction_read_only !== "on"
          ) {
            throw new Error(
              "PREFLIGHT_READ_ONLY_GUARD_FAILED"
            );
          }

          await tx.$executeRawUnsafe(
            P22C3C_PREFLIGHT_DO
          );

          const rows =
            await tx.$queryRawUnsafe<
              Array<JsonRecord>
            >(
              P22C3C_PREFLIGHT_RESULT_QUERY
            );

          preflight =
            singleJsonText<PreflightShape>(
              rows,
              "PREFLIGHT"
            );

          throw new Error(
            ROLLBACK_SENTINEL
          );
        },
        {
          isolationLevel:
            P22C3C_ISOLATION_LEVELS.preflight,
          maxWait: 10000,
          timeout: 60000
        }
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes(
          ROLLBACK_SENTINEL
        )
      ) {
        throw error;
      }
    }

    if (
      !preflight ||
      preflight.phase !== "P22C-3C" ||
      preflight.mode !==
        "PRODUCTION_PREFLIGHT_READ_ONLY" ||
      preflight.result !== "PASS" ||
      preflight.transactionReadOnly !== "on" ||
      preflight.productAuthority !==
        "117 / 104 ACTIVE / 13 DRAFT" ||
      preflight.categories !== 16 ||
      preflight.authoritySchemaAbsent !== true ||
      preflight.stagingMetadataAbsent !== true
    ) {
      return safeFailure(
        "PREFLIGHT_ASSERTION_FAILED",
        409
      );
    }

    consumed = true;

    return Response.json(
      {
        phase: "P22C-3C",
        result: "PASS",
        operation:
          "PRODUCTION_RUNTIME_READ_ONLY_GATE",
        productionProjectRef:
          P22C3C_PRODUCTION_PROJECT_REF,
        deploymentGitCommitSha:
          process.env.VERCEL_GIT_COMMIT_SHA ??
          null,
        environment: {
          vercelEnv:
            process.env.VERCEL_ENV,
          vercelTargetEnv:
            process.env.VERCEL_TARGET_ENV ??
            null
        },
        databaseIdentity: {
          projectRefVerified: true,
          defaultTransactionReadOnly: "on",
          serverVersion:
            databaseIdentity.server_version,
          serverVersionNum:
            databaseIdentity.server_version_num,
          inRecovery: false
        },
        snapshot: {
          result: "PASS",
          catalog:
            snapshot.catalog,
          authorityTables:
            snapshot.authorityTables,
          authorityEnums:
            snapshot.authorityEnums,
          helperFunctions:
            snapshot.helperFunctions,
          migrationLedgers:
            snapshot.migrationLedgers,
          stagingOnlyTables:
            snapshot.stagingOnlyTables,
          operations:
            snapshot.operations
        },
        preflight: {
          result: "PASS",
          productAuthority:
            preflight.productAuthority,
          categories:
            preflight.categories,
          authoritySchemaAbsent:
            preflight.authoritySchemaAbsent,
          stagingMetadataAbsent:
            preflight.stagingMetadataAbsent
        },
        safety: {
          databaseUrlExposed: false,
          databaseUrlLogged: false,
          defaultTransactionReadOnly: true,
          snapshotTransactionRolledBack: true,
          preflightTransactionRolledBack: true,
          migrationApplied: false,
          databaseWritePerformed: false,
          environmentMutationPerformed: false
        },
        gate: {
          consumed: true,
          expiresAt:
            GATE_EXPIRES_AT
        }
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch {
    return safeFailure(
      "RUNTIME_GATE_FAILED_SAFE"
    );
  } finally {
    await prisma.$disconnect().catch(
      () => undefined
    );
  }
}
