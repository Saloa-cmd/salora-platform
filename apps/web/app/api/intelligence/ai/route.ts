import { type NextRequest } from "next/server";
import { handleIntelligenceRoute } from "@/lib/server/intelligenceHttp";
import { loadDatabaseIntelligence } from "@/lib/server/databaseIntelligence";

export function GET(request: NextRequest) {
  return handleIntelligenceRoute(request, async (actor) => {
    const snapshot = await loadDatabaseIntelligence({ userId: actor.userId, roles: actor.roles });
    return snapshot.ai;
  });
}
