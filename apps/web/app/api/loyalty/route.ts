import { applyPersistentLoyaltyMutation, loyaltyInputSchema, withPrismaAuthContext } from "@salora/backend";
import { type NextRequest } from "next/server";
import { currentAuthPayload } from "@/lib/server/auth/http";
import type { RoleName } from "@/lib/server/auth/types";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "staff:read"))) return responseError("Forbidden.", requestId, 403);
  const actor = await currentAuthPayload(request);
  const entries = await withPrismaAuthContext({ userId: actor.sub, roles: actor.roles, dbRole: "authenticated" }, (prisma) => prisma.$queryRaw(
    `SELECT le.id, la.customer_id AS "customerId", le.type::text AS type, le.points, le.reason,
            le.order_id AS "orderId", le.payment_id AS "paymentId", le.refund_id AS "refundId",
            le.created_at AS "createdAt"
       FROM loyalty_ledger_entries le
       JOIN loyalty_accounts la ON la.id=le.account_id
      ORDER BY le.created_at DESC
      LIMIT 250`
  ));
  return responseJson(entries, requestId);
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "user:write"))) return responseError("Forbidden.", requestId, 403);
  const actor = await currentAuthPayload(request);
  const roles = actor.roles as RoleName[];
  if (!roles.some((role) => role === "MANAGER" || role === "ADMIN")) return responseError("Manager approval is required for manual loyalty adjustments.", requestId, 403);
  const parsed = await parseJson(request, loyaltyInputSchema);
  if (!parsed.success) return responseError("Invalid loyalty payload.", requestId);
  const key = request.headers.get("idempotency-key");
  if (!key || key.length > 200) return responseError("A valid Idempotency-Key header is required.", requestId, 400);
  const result = await applyPersistentLoyaltyMutation({
    customerId: parsed.data.customerId,
    points: parsed.data.points,
    type: parsed.data.points < 0 ? "ADJUST" : "BONUS",
    reason: parsed.data.reason,
    idempotencyKey: `api:${key}`,
    metadata: { source: "loyalty_api", requestId, actorId: actor.sub, actorRoles: roles }
  });
  return responseJson(result, requestId, result.applied ? 201 : 200);
}
