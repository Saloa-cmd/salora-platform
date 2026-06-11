import { recommendProducts, recommendProductsAdvanced } from "@salora/backend";
import { type NextRequest } from "next/server";
import { handleAiRoute } from "@/lib/server/aiHttp";

export async function POST(request: NextRequest) {
  return handleAiRoute(request, async (input) => {
    const gateway = await recommendProducts(input);
    const recommendations = recommendProductsAdvanced({
      products: input.products,
      preferences: input.customerPreferences,
      loyalty: input.loyalty
    });
    return { gateway, recommendations };
  });
}
