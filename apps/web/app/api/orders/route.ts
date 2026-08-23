import { notifyWhatsAppOrderEvent } from "@salora/backend";
import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/repositories/control-tower";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";
import { currentAuthPayload } from "@/lib/server/auth/http";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";
import { writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";
import { codOrderSchema, createCodOrder, OrderIntegrityError } from "@/lib/server/supremacyControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function decimalNumber(value: { toString(): string } | number | string | null | undefined) {
  return value == null ? undefined : Number(value.toString());
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "order:read"))) {
    return responseError("Forbidden.", requestId, 403);
  }
  const actor = await currentAuthPayload(request);
  const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
  const orders = await repo.orders.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, payments: true, timeline: true, customer: true }
  });
  return responseJson(orders, requestId);
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "orders");
    const parsed = await parseJson(request, codOrderSchema);
    if (!parsed.success) return responseError("Invalid COD order payload.", requestId);
    const order = await createCodOrder({ ...parsed.data, customerId: undefined });
    await notifyWhatsAppOrderEvent({
      event: "ORDER_CREATED",
      orderId: order.id,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      total: decimalNumber(order.total),
      correlationId: requestId
    }).catch(() => undefined);
    await writeActivity({ action: "order.codCreate.public", entityType: "CafeOrder", entityId: order.id, requestId, metadata: { paymentMethod: "COD" } });
    await writeAudit({ action: "CREATE", entityType: "CafeOrder", entityId: order.id, after: order, requestId, reason: "Public COD checkout order created" });
    return responseJson({ ...order, customer: undefined }, requestId, 201);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    if (error instanceof OrderIntegrityError) {
      return responseError(error.message, requestId, error.status);
    }
    return responseError("Order could not be created safely.", requestId, 500);
  }
}
