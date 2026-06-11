import { getAiIntelligenceSnapshot } from "@salora/backend";
import { type NextRequest } from "next/server";
import { handleIntelligenceRoute } from "@/lib/server/intelligenceHttp";

export function GET(request: NextRequest) {
  return handleIntelligenceRoute(request, getAiIntelligenceSnapshot);
}
