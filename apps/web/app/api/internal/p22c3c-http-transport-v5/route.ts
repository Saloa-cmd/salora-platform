export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXPIRES_AT = "2026-08-13T18:00:00+04:00";

const transportHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Salora-P22C3C-Gateway": "HTTP_TRANSPORT_ONLY_V5",
  "X-Salora-Database-Access": "NONE",
  "X-Salora-Migration": "NONE",
  "X-Salora-DDL-DML": "NONE",
  "X-Salora-Gateway-Expires": EXPIRES_AT
};

function expired() {
  return Date.now() > Date.parse(EXPIRES_AT);
}

export function HEAD() {
  return new Response(null, {
    status: expired() ? 410 : 204,
    headers: transportHeaders
  });
}

export function GET() {
  if (expired()) {
    return Response.json(
      { phase: "P22C-3C", result: "EXPIRED" },
      { status: 410, headers: transportHeaders }
    );
  }

  return Response.json(
    {
      phase: "P22C-3C",
      result: "READY",
      operation: "HTTP_TRANSPORT_ONLY_V5",
      deploymentGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      safety: {
        databaseClientImported: false,
        databaseEnvironmentRead: false,
        databaseConnectionAttempted: false,
        snapshotExecuted: false,
        preflightExecuted: false,
        migrationApplied: false,
        ddlDmlExecuted: false
      },
      expiresAt: EXPIRES_AT
    },
    { status: 200, headers: transportHeaders }
  );
}
