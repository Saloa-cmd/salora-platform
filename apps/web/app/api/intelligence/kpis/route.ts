import { type NextRequest } from "next/server";
import { handleIntelligenceRoute } from "@/lib/server/intelligenceHttp";
import { loadDatabaseIntelligence } from "@/lib/server/databaseIntelligence";

export function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period");
  return handleIntelligenceRoute(request, async (actor) => {
    const selectedPeriod = period === "weekly" || period === "monthly" ? period : "daily";
    const snapshot = await loadDatabaseIntelligence({ userId: actor.userId, roles: actor.roles }, selectedPeriod);

    if (period !== "executive") return snapshot;

    return {
      daily: snapshot,
      weekly: { ...snapshot, period: "weekly" as const },
      monthly: { ...snapshot, period: "monthly" as const }
    };
  });
}
