import { notifyWhatsAppOrderEvent, type WhatsAppOrderNotificationEvent } from "@salora/backend";
import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, pagination, parseBody, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";
import { assertOrderTransition, codOrderSchema, createCodOrder, orderStatusSchema } from "@/lib/server/supremacyControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const whatsappOrderEvents: Partial<Record<string, WhatsAppOrderNotificationEvent>> = {
  PENDING_CONFIRMATION: "ORDER_CREATED",
  ACCEPTED: "ORDER_CONFIRMED",
  PREPARING: "ORDER_PREPARING",
  READY: "ORDER_READY",
  DELIVERED: "ORDER_DELIVERED"
};

function decimalNumber(value: { toString(): string } | number | string | null | undefined) {
  return value == null ? undefined : Number(value.toString());
}

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "order:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const { take, skip } = pagination(request, { limit: 100, maxLimit: 100 });
    const orders = await repo.orders.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { items: true, payments: true, timeline: { orderBy: { createdAt: "asc" } }, customer: { include: { loyalty: true } } }
    });
    return responseJson(orders, id);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "order:update");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, codOrderSchema);
    if (!parsed.success) return responseError("Invalid COD order payload.", id);
    const order = await createCodOrder(parsed.data, { userId: actor.sub, roles: actor.roles });
    await notifyWhatsAppOrderEvent({
      event: "ORDER_CREATED",
      orderId: order.id,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      total: decimalNumber(order.total),
      correlationId: id
    }).catch(() => undefined);
    await writeActivity({ actorId: actor.sub, action: "order.codCreate", entityType: "CafeOrder", entityId: order.id, requestId: id, metadata: { paymentMethod: "COD" } }, repo);
    await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "CafeOrder", entityId: order.id, after: order, requestId: id, reason: "COD order created from Control Tower" }, repo);
    return responseJson(order, id, 201);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function PATCH(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "order:update");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, orderStatusSchema);
    if (!parsed.success) return responseError("Invalid order status payload.", id);
    const input = parsed.data;
    const before = await repo.orders.findUnique({ id: input.orderId }, { include: { items: true, payments: true, timeline: true } });
    if (!before) return responseError("Order not found.", id, 404);
    assertOrderTransition(before.status, input.status);
    const after = await repo.orders.update(
      { id: input.orderId },
      {
        status: input.status,
        timeline: { create: { status: input.status, message: input.note ?? `Control Tower moved order to ${input.status}.` } }
      },
      { include: { items: true, payments: true, timeline: true } }
    );
    const whatsappEvent = whatsappOrderEvents[after.status];
    if (whatsappEvent) {
      await notifyWhatsAppOrderEvent({
        event: whatsappEvent,
        orderId: after.id,
        customerPhone: after.customerPhone,
        customerName: after.customerName,
        total: decimalNumber(after.total),
        correlationId: id
      }).catch(() => undefined);
    }
    await writeActivity({ actorId: actor.sub, action: "order.status", entityType: "CafeOrder", entityId: after.id, requestId: id, metadata: { from: before.status, to: after.status } }, repo);
    await writeAudit({ actorId: actor.sub, action: "UPDATE", entityType: "CafeOrder", entityId: after.id, before, after, requestId: id, reason: input.note }, repo);
    return responseJson(after, id);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid order transition")) return responseError(error.message, id, 409);
    return handleError(error, id);
  }
}
