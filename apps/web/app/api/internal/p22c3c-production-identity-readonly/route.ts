import { createHash, timingSafeEqual } from "node:crypto";
import { createP22C3CReadOnlyPrismaClient, P22C3C_PRODUCTION_PROJECT_REF } from "@salora/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const GATE_TOKEN_SHA256 = "cbd0acf1b8704880d7f237ddfa472f18bab70878ab23978bdc526e769f41d27a";
const GATE_EXPIRES_AT = "2026-08-12T19:30:00+04:00";
let consumed = false;

function respond(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: {
    "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex",
    "X-Salora-P22C3C-Gate": "IDENTITY_DIAGNOSTIC_READ_ONLY_ONLY"
  }});
}
function tokenMatches(value: string) {
  const actual=createHash("sha256").update(value,"utf8").digest();
  const expected=Buffer.from(GATE_TOKEN_SHA256,"hex");
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}
function fail(code: string,status=503) {
  return respond({phase:"P22C-3C",result:"FAIL_SAFE",code,databaseUrlExposed:false,
    snapshotExecuted:false,preflightExecuted:false,migrationApplied:false,
    ddlDmlExecuted:false,databaseWritePerformed:false},status);
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
  catch { return fail("PRODUCTION_PROJECT_REF_VALIDATION_FAILED",409); }

  try {
    await prisma.$connect();
    const rows=await prisma.$queryRawUnsafe<Array<{
      server_version_num:number; default_transaction_read_only:string;
      transaction_read_only:string; in_recovery:boolean;
    }>>(`SELECT
      current_setting('server_version_num')::integer AS server_version_num,
      current_setting('default_transaction_read_only') AS default_transaction_read_only,
      current_setting('transaction_read_only') AS transaction_read_only,
      pg_is_in_recovery() AS in_recovery;`);
    const identity=rows[0];
    if (!identity) return fail("IDENTITY_RESULT_MISSING");

    consumed=true;
    const checks={
      productionProjectRefVerified:true,
      defaultTransactionReadOnlyOn:identity.default_transaction_read_only==="on",
      transactionReadOnlyOn:identity.transaction_read_only==="on",
      postgres17OrNewer:identity.server_version_num>=170000,
      notInRecovery:identity.in_recovery===false
    };
    return respond({
      phase:"P22C-3C",result:Object.values(checks).every(Boolean)?"PASS":"DIAGNOSTIC_FINDING",
      operation:"PRODUCTION_IDENTITY_DIAGNOSTIC_READ_ONLY_ONLY",
      productionProjectRef:P22C3C_PRODUCTION_PROJECT_REF,
      deploymentGitCommitSha:process.env.VERCEL_GIT_COMMIT_SHA??null,
      identity:{serverVersionNum:identity.server_version_num,
        defaultTransactionReadOnly:identity.default_transaction_read_only,
        transactionReadOnly:identity.transaction_read_only,
        inRecovery:identity.in_recovery},
      checks,
      safety:{databaseUrlExposed:false,databaseUrlLogged:false,snapshotExecuted:false,
        preflightExecuted:false,migrationApplied:false,ddlDmlExecuted:false,
        databaseWritePerformed:false,environmentMutationPerformed:false},
      gate:{consumed:true,expiresAt:GATE_EXPIRES_AT}
    },200);
  } catch { return fail("IDENTITY_DIAGNOSTIC_FAILED_SAFE"); }
  finally { await prisma.$disconnect().catch(()=>undefined); }
}
