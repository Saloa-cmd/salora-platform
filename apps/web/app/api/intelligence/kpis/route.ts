import { generateExecutiveReport, generateKpis } from "@salora/backend";
import { type NextRequest } from "next/server";
import { handleIntelligenceRoute } from "@/lib/server/intelligenceHttp";

export function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period");
  return handleIntelligenceRoute(request, () => period === "executive" ? generateExecutiveReport() : generateKpis(period === "weekly" || period === "monthly" ? period : "daily"));
}
