import { saloraRuntime } from "@salora/config";
import { aggregateStatus, databaseHealth, queueHealth, redisHealth } from "@salora/backend";
import { NextResponse } from "next/server";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";

export const dynamic = "force-dynamic";

export async function GET() {
  const [infrastructure, menuSnapshot] = await Promise.all([
    Promise.all([
    databaseHealth(),
    redisHealth(),
    queueHealth()
    ]),
    getPublicMenuSnapshot()
  ]);
  const infrastructureStatus = aggregateStatus(infrastructure);
  const checks = {
    catalogLoaded: menuSnapshot.products.length > 0,
    catalogSource: menuSnapshot.source,
    catalogStale: menuSnapshot.stale,
    catalogLive: menuSnapshot.source === "database" && !menuSnapshot.stale,
    databaseMenuHealth: menuSnapshot.databaseHealth,
    siteUrlConfigured: saloraRuntime.siteUrl.startsWith("http"),
    whatsappConfigured: /^\d{8,15}$/.test(saloraRuntime.whatsappNumber),
    infrastructureStatus
  };
  const ok =
    checks.catalogLoaded &&
    checks.catalogLive &&
    checks.siteUrlConfigured &&
    checks.whatsappConfigured &&
    infrastructureStatus !== "critical";

  return NextResponse.json(
    {
      ok,
      status: ok ? "ready" : "not-ready",
      service: "salora-web",
      checks,
      infrastructure,
      checkedAt: new Date().toISOString()
    },
    { status: ok ? 200 : 503 }
  );
}
