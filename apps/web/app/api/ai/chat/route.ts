import { askConcierge } from "@salora/backend";
import { type NextRequest } from "next/server";
import { handleAiRoute } from "@/lib/server/aiHttp";

export async function POST(request: NextRequest) {
  return handleAiRoute(request, askConcierge);
}
