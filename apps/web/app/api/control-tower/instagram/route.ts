import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, parseBody, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";
import { commandDraftSchema, providerReadiness } from "@/lib/server/supremacyControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    await requireControlPermission(request, "system:read");
    const providers = await providerReadiness();
    const instagram = providers.find((provider) => provider.name === "Instagram");
    return responseJson({ targetAccount: "@salora.cafe", status: instagram?.readiness ?? "BLOCKED", provider: instagram }, id);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, commandDraftSchema);
    if (!parsed.success || parsed.data.channel !== "instagram") return responseError("Invalid Instagram draft payload.", id);
    const record = await repo.aiRecords.create({
      provider: "control-tower",
      model: "draft",
      intent: "instagram_draft",
      context: { targetAccount: "@salora.cafe", draftOnly: true, scheduledFor: parsed.data.scheduledFor },
      reason: `${parsed.data.title}\n\n${parsed.data.body}`
    });
    await writeActivity({ actorId: actor.sub, action: "instagram.draftCreate", entityType: "AiRecommendationRecord", entityId: record.id, requestId: id }, repo);
    await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "AiRecommendationRecord", entityId: record.id, after: record, requestId: id, reason: "Instagram command draft created; not published" }, repo);
    return responseJson(record, id, 201);
  } catch (error) {
    return handleError(error, id);
  }
}
