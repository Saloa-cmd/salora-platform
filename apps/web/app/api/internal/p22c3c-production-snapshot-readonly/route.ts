import { createHash, timingSafeEqual } from "node:crypto";
import { createP22C3CReadOnlyPrismaClient, P22C3C_ISOLATION_LEVELS, P22C3C_PRODUCTION_PROJECT_REF } from "@salora/backend";
import { P22C3C_SNAPSHOT_QUERY } from "@/lib/server/p22c3cRuntimeQueries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const GATE_TOKEN_SHA256 = "fe388f9c8a9d5cb15b47962c51bd89a1125894c4411ccd38cbe4f120c5e718d2";
const GATE_EXPIRES_AT = "2026-08-12T20:30:00+04:00";
const ROLLBACK_SENTINEL = "__P22C3C_SNAPSHOT_INTENTIONAL_ROLLBACK__";
let consumed = false;

type JsonRecord = Record<string, unknown>;
type Snapshot = {
  phase: string; mode: string; transactionReadOnly: string;
  catalog: {
    products: { total: number; active: number; draft: number; paused: number; archived: number };
    categories: { total: number };
  };
  operations: { transactionsOver10Minutes: number; inRecovery: boolean };
};

function respond(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: {
    "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex",
    "X-Salora-P22C3C-Gate": "EXPLICIT_TRANSACTION_READ_ONLY_SNAPSHOT_REDACTED"
  }});
}
function fail(code: string, status = 503) {
  return respond({ phase: "P22C-3C", result: "FAIL_SAFE", code,
    databaseUrlExposed: false, evidenceRedacted: true, preflightExecuted: false,
    migrationApplied: false, ddlDmlExecuted: false, databaseWritePerformed: false }, status);
}
function tokenMatches(value: string) {
  const actual=createHash("sha256").update(value,"utf8").digest();
  const expected=Buffer.from(GATE_TOKEN_SHA256,"hex");
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}
function parseSnapshot(rows: Array<JsonRecord>) {
  if (rows.length!==1) throw new Error("SNAPSHOT_ROW_COUNT");
  const raw=Object.values(rows[0]??{})[0];
  if (typeof raw!=="string") throw new Error("SNAPSHOT_NOT_TEXT");
  return JSON.parse(raw) as Snapshot;
}

export async function GET(request: Request) {
  if (process.env.VERCEL!=="1" || process.env.VERCEL_ENV!=="production" ||
      (process.env.VERCEL_TARGET_ENV && process.env.VERCEL_TARGET_ENV!=="production"))
    return respond({phase:"P22C-3C",result:"NOT_AVAILABLE"},404);
  if (Date.now()>Date.parse(GATE_EXPIRES_AT) || consumed)
    return respond({phase:"P22C-3C",result:"EXPIRED"},410);
  const supplied=new URL(request.url).searchParams.get("gate")??"";
  if (!supplied || !tokenMatches(supplied))
    return respond({phase:"P22C-3C",result:"NOT_AVAILABLE"},404);

  const databaseUrl=process.env.DATABASE_URL;
  if (!databaseUrl) return fail("DATABASE_URL_MISSING");

  let prisma;
  try { prisma=createP22C3CReadOnlyPrismaClient(databaseUrl); }
  catch { return fail("PRODUCTION_DATABASE_IDENTITY_REJECTED",409); }

  let snapshot: Snapshot|undefined;
  let transactionReadOnly="off";
  try {
    await prisma.$connect();
    const identity=await prisma.$queryRawUnsafe<Array<{
      server_version_num:number; default_transaction_read_only:string; in_recovery:boolean;
    }>>(`SELECT current_setting('server_version_num')::integer AS server_version_num,
      current_setting('default_transaction_read_only') AS default_transaction_read_only,
      pg_is_in_recovery() AS in_recovery;`);
    const db=identity[0];
    if (!db || db.server_version_num<170000 || db.in_recovery)
      return fail("DATABASE_IDENTITY_GUARD_FAILED",409);

    try {
      await prisma.$transaction(async(tx)=>{
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        const settings=await tx.$queryRawUnsafe<Array<{transaction_read_only:string}>>(
          "SELECT current_setting('transaction_read_only') AS transaction_read_only;"
        );
        transactionReadOnly=settings[0]?.transaction_read_only??"off";
        if (transactionReadOnly!=="on") throw new Error("EXPLICIT_READ_ONLY_GUARD_FAILED");
        snapshot=parseSnapshot(await tx.$queryRawUnsafe<Array<JsonRecord>>(P22C3C_SNAPSHOT_QUERY));
        throw new Error(ROLLBACK_SENTINEL);
      },{isolationLevel:P22C3C_ISOLATION_LEVELS.snapshot,maxWait:10000,timeout:60000});
    } catch(error) {
      if (!(error instanceof Error)||!error.message.includes(ROLLBACK_SENTINEL)) throw error;
    }

    if (!snapshot) return fail("SNAPSHOT_RESULT_MISSING");
    consumed=true;
    return respond({
      phase:"P22C-3C",result:"PASS",operation:"PRODUCTION_EXPLICIT_TRANSACTION_READ_ONLY_SNAPSHOT_REDACTED",
      productionProjectRef:P22C3C_PRODUCTION_PROJECT_REF,
      deploymentGitCommitSha:process.env.VERCEL_GIT_COMMIT_SHA??null,
      databaseIdentity:{projectRefVerified:true,serverVersionMajorAtLeast17:true,
        defaultTransactionReadOnly:db.default_transaction_read_only,
        explicitTransactionReadOnly:transactionReadOnly,inRecovery:db.in_recovery},
      snapshot:{phase:snapshot.phase,mode:snapshot.mode,transactionReadOnly:snapshot.transactionReadOnly,
        catalog:{products:snapshot.catalog.products,categories:snapshot.catalog.categories},
        operations:{transactionsOver10Minutes:snapshot.operations.transactionsOver10Minutes,
          inRecovery:snapshot.operations.inRecovery}},
      safety:{evidenceRedacted:true,fingerprintsReturned:false,slugsReturned:false,
        explicitSetTransactionReadOnly:true,databaseUrlExposed:false,databaseUrlLogged:false,
        snapshotTransactionRolledBack:true,preflightExecuted:false,migrationApplied:false,
        ddlDmlExecuted:false,databaseWritePerformed:false,environmentMutationPerformed:false},
      gate:{consumed:true,expiresAt:GATE_EXPIRES_AT}
    },200);
  } catch { return fail("SNAPSHOT_GATE_FAILED_SAFE"); }
  finally { await prisma.$disconnect().catch(()=>undefined); }
}
