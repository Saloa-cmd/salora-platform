import { saloraRuntime } from "@salora/config";
import { aggregateStatus, databaseHealth, queueHealth, redisHealth } from "@salora/backend";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";
import {
  createPublicOperationalStatus,
  PUBLIC_OPERATIONAL_STATUS_HEADERS
} from "@/lib/server/publicOperationalStatus";

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
    catalogLive:
      menuSnapshot.source === "published-revision" &&
      Boolean(menuSnapshot.revision) &&
      !menuSnapshot.stale,
    catalogRevisionId: menuSnapshot.revision?.id ?? null,
    catalogRevisionVersion: menuSnapshot.revision?.version ?? null,
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
  const status = ok ? "ready" : "not-ready";

  return Response.json(
    createPublicOperationalStatus({
      status,
      checks,
      infrastructure,
      infrastructureStatus
    }),
    {
      status: ok ? 200 : 503,
      headers: PUBLIC_OPERATIONAL_STATUS_HEADERS
    }
  );
}
