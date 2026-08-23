import { type NextRequest } from "next/server";
import { routeAiRequest } from "@salora/backend";
import { z } from "zod";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, parseBody, requireControlPermission, requestId, writeActivity } from "@/lib/server/simpleLaunchControl";
import { loadControlTowerDataPulse } from "@/lib/server/controlTowerDataPulse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copilotSchema = z.object({
  section: z.enum(["overview", "experience", "menu", "orders", "customers", "marketing", "ai", "analytics", "operations", "settings"]),
  question: z.string().trim().min(2).max(1200),
  locale: z.enum(["ar", "en"]).default("ar")
});

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const parsed = await parseBody(request, copilotSchema);
    if (!parsed.success) return responseError("Invalid Copilot request.", id, 400);

    const input = parsed.data;
    const pulse = await loadControlTowerDataPulse({ userId: actor.sub, roles: actor.roles });
    const safeContext = {
      generatedAt: pulse.generatedAt,
      source: pulse.source,
      commerce: pulse.commerce,
      engagement: pulse.engagement,
      ai: pulse.ai,
      governance: pulse.governance
    };

    const languageRule = input.locale === "ar"
      ? "Respond in clear professional Arabic suitable for an Omani operator dashboard."
      : "Respond in concise professional English suitable for an operator dashboard.";

    const result = await routeAiRequest({
      message: [
        "You are SALORA Control Tower Copilot.",
        languageRule,
        "Use only the observed aggregate data supplied below and the operator question.",
        "Never invent business metrics, credentials, customer details, or deployment state.",
        "Do not claim to publish, modify, delete, approve, charge, message, or deploy anything.",
        "Give a short diagnosis, the most important implication, and up to three safe next actions for human review.",
        `Workspace section: ${input.section}`,
        `Operator question: ${input.question}`,
        `Observed data: ${JSON.stringify(safeContext)}`
      ].join("\n"),
      intent: "concierge",
      channel: "web",
      locale: input.locale,
      context: {
        channel: "web",
        locale: input.locale
      }
    });

    await writeActivity({
      actorId: actor.sub,
      action: "controlTower.copilot",
      entityType: "AiCopilot",
      requestId: id,
      metadata: {
        section: input.section,
        provider: result.provider.provider,
        model: result.provider.model,
        correlationId: result.correlationId,
        safetyBlocked: result.safety.blocked
      }
    });

    return responseJson({
      answer: result.answer,
      provider: result.provider,
      usage: result.usage,
      safety: result.safety,
      evaluation: result.evaluation,
      correlationId: result.correlationId,
      observedAt: pulse.generatedAt
    }, id);
  } catch (error) {
    return handleError(error, id);
  }
}
