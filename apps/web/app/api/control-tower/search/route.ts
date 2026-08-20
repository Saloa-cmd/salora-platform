import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { z } from "zod";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { hasPermission } from "@/lib/server/auth/rbac";
import type { RoleName } from "@/lib/server/auth/types";
import { handleError, requireControlPermission, requestId } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.string().trim().min(2).max(80);

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "content:read");
    const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("q"));
    if (!parsed.success) return responseError("Search requires 2–80 characters.", id, 422);
    const q = parsed.data;
    const roles = actor.roles as RoleName[];
    const repo = await createControlTowerRepository({ userId: actor.sub, roles });
    const results: Array<{ id: string; type: "product" | "category" | "order" | "customer"; title: string; detail?: string; href: string }> = [];

    if (hasPermission(roles, "catalog:read")) {
      const products = await repo.products.findMany({ where: { brandKey: "SALORA", OR: [{ name: { contains: q, mode: "insensitive" } }, { nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] }, select: { id: true, name: true, nameAr: true, nameEn: true, slug: true, status: true }, take: 6, orderBy: { name: "asc" } });
      results.push(...products.map((product: any) => ({ id: product.id, type: "product" as const, title: product.nameAr || product.nameEn || product.name, detail: `${product.slug} · ${product.status}`, href: `/control-tower/menu?product=${encodeURIComponent(product.id)}` })));
      const categories = await repo.categories.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] }, select: { id: true, name: true, nameAr: true, nameEn: true, slug: true }, take: 4, orderBy: { sortOrder: "asc" } });
      results.push(...categories.map((category: any) => ({ id: category.id, type: "category" as const, title: category.nameAr || category.nameEn || category.name, detail: category.slug, href: `/control-tower/menu?category=${encodeURIComponent(category.id)}` })));
    }
    if (hasPermission(roles, "order:read")) {
      const orderFilters: any[] = [{ customerName: { contains: q, mode: "insensitive" } }];
      if (z.string().uuid().safeParse(q).success) orderFilters.unshift({ id: q });
      const orders = await repo.orders.findMany({ where: { OR: orderFilters }, select: { id: true, status: true, customerName: true, createdAt: true }, take: 5, orderBy: { createdAt: "desc" } });
      results.push(...orders.map((order: any) => ({ id: order.id, type: "order" as const, title: `Order ${order.id.slice(0, 8)}`, detail: `${order.status}${order.customerName ? ` · ${order.customerName}` : ""}`, href: `/control-tower/orders?order=${encodeURIComponent(order.id)}` })));
    }
    if (hasPermission(roles, "staff:read")) {
      const customers = await repo.cms.run<any[]>((db: any) => db.customerProfile.findMany({ where: { displayName: { contains: q, mode: "insensitive" } }, select: { id: true, displayName: true, updatedAt: true }, take: 5, orderBy: { updatedAt: "desc" } }));
      results.push(...customers.map((customer: any) => ({ id: customer.id, type: "customer" as const, title: customer.displayName || "Customer", detail: "Customer profile", href: `/control-tower/customers?customer=${encodeURIComponent(customer.id)}` })));
    }
    return responseJson({ query: q, results: results.slice(0, 15) }, id);
  } catch (error) { return handleError(error, id); }
}
