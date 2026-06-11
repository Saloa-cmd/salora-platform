import { products } from "@salora/data";
import { aggregateStatus, databaseHealth, databaseMigrationStatus, queueHealth, redisHealth } from "@salora/backend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const infrastructure = await Promise.all([
    databaseHealth(),
    databaseMigrationStatus(),
    redisHealth(),
    queueHealth()
  ]);
  const status = aggregateStatus(infrastructure);

  return NextResponse.json({
    ok: status !== "critical",
    status,
    service: "salora-web",
    version: "0.1.0",
    checks: {
      productCatalog: products.length,
      runtime: "nextjs",
      infrastructure
    },
    checkedAt: new Date().toISOString()
  }, { status: status === "critical" ? 503 : 200 });
}
