import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { couponMutationSchema, handleError, pagination, parseBody, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const { take, skip } = pagination(request, { limit: 100, maxLimit: 100 });
    const coupons = await repo.coupons.findMany({ take, skip, orderBy: { createdAt: "desc" }, include: { redemptions: true } });
    return responseJson(coupons.map((coupon: any) => ({ ...coupon, usageCount: coupon.redemptions.length, redemptions: undefined })), id);
  } catch (error) {
    return handleError(error, id);
  }
}

async function mutate(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, couponMutationSchema);
    if (!parsed.success) return responseError("Invalid coupon mutation payload.", id);
    const input = parsed.data;
    const code = input.code.toUpperCase();
    const before = await repo.coupons.findUnique({ code });
    const coupon = input.action === "create"
      ? await repo.coupons.create({
          code,
          name: input.name,
          description: input.description,
          discountType: input.discountType,
          discountValue: input.discountValue,
          maxDiscountAmount: input.maxDiscountAmount,
          minimumOrderTotal: input.minimumOrderTotal,
          isActive: true
        })
      : await repo.coupons.update({ code }, { isActive: input.isActive });
    await writeActivity({ actorId: actor.sub, action: `coupon.${input.action}`, entityType: "Coupon", entityId: coupon.id, requestId: id, metadata: { code } }, repo);
    await writeAudit({ actorId: actor.sub, action: before ? "UPDATE" : "CREATE", entityType: "Coupon", entityId: coupon.id, before, after: coupon, requestId: id }, repo);
    return responseJson(coupon, id, input.action === "create" ? 201 : 200);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function POST(request: NextRequest) {
  return mutate(request);
}

export async function PATCH(request: NextRequest) {
  return mutate(request);
}
