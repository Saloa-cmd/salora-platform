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
    const actor = await requireControlPermission(request, "system:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const providers = await providerReadiness();
    const whatsapp = providers.find((provider) => provider.name === "WhatsApp");
    const { conversations, messages, webhookEvents, webhookLedgerReady } = await repo.whatsapp.commandCenter();
    return responseJson({
      targetContact: "+968 9023 9624",
      status: whatsapp?.readiness ?? "BLOCKED",
      provider: whatsapp,
      commandCenter: {
        conversations,
        messages,
        webhookEvents,
        runtimeHealth: {
          webhookLedgerReady,
          aiControls: ["pause", "resume", "escalate_to_human"],
          supportedNotifications: ["ORDER_CREATED", "ORDER_CONFIRMED", "ORDER_PREPARING", "ORDER_READY", "ORDER_DELIVERED"]
        }
      }
    }, id);
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
    if (!parsed.success || parsed.data.channel !== "whatsapp") return responseError("Invalid WhatsApp draft payload.", id);
    const record = await repo.aiRecords.create({
      provider: "control-tower",
      model: "draft",
      intent: "whatsapp_draft",
      context: { targetContact: "+968 9023 9624", draftOnly: true, scheduledFor: parsed.data.scheduledFor },
      reason: `${parsed.data.title}\n\n${parsed.data.body}`
    });
    await writeActivity({ actorId: actor.sub, action: "whatsapp.draftCreate", entityType: "AiRecommendationRecord", entityId: record.id, requestId: id }, repo);
    await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "AiRecommendationRecord", entityId: record.id, after: record, requestId: id, reason: "WhatsApp command draft created; not sent" }, repo);
    return responseJson(record, id, 201);
  } catch (error) {
    return handleError(error, id);
  }
}
