import type { Product } from "@salora/types";
import { z } from "zod";
import { type NextRequest } from "next/server";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { getMenuAuthoritySnapshot } from "./menuAuthority";
import { enforceRateLimit, rateLimitResponse } from "./rateLimit";

export const aiRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  channel: z.enum(["web", "mobile", "future_whatsapp", "future_voice"]).default("web"),
  locale: z.string().min(2).max(12).default("en"),
  customerPreferences: z.record(z.string(), z.unknown()).optional(),
  loyalty: z.object({ points: z.number().optional(), tier: z.string().optional() }).optional(),
  order: z.object({
    items: z.array(z.object({ name: z.string(), quantity: z.number().int().positive() })).optional(),
    total: z.number().optional()
  }).optional()
});

export type AuthorityAwareAiInput = z.infer<typeof aiRequestSchema> & {
  products: Product[];
  menuAuthority: {
    collectionId: string;
    revisionId: string;
    revisionVersion: number;
  };
};

export async function handleAiRoute(
  request: NextRequest,
  run: (input: AuthorityAwareAiInput) => Promise<unknown>
) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await enforceRateLimit(request, "ai");
    const body = await request.json().catch(() => null);
    const parsed = aiRequestSchema.safeParse(body);

    if (!parsed.success) {
      return responseError("Invalid AI payload.", requestId, 400);
    }

    const authority = await getMenuAuthoritySnapshot();
    if (!authority.revision) {
      return responseError("AI recommendations require a published menu revision.", requestId, 503);
    }

    const result = await run({
      ...parsed.data,
      products: authority.products,
      menuAuthority: {
        collectionId: authority.collection.id,
        revisionId: authority.revision.id,
        revisionVersion: authority.revision.version
      }
    });
    const response = responseJson(result, requestId);
    response.headers.set("x-salora-menu-revision", authority.revision.id);
    response.headers.set("x-salora-menu-version", String(authority.revision.version));
    return response;
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return responseError("AI request could not be completed safely.", requestId, 500);
  }
}
