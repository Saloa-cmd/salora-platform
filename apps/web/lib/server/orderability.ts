import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext, type PrismaAuthContext } from "@salora/backend/database/rls-context";
import { catalogProductIsAvailable, currentCatalogPrice, decimalNumber, normalizeCatalogModifierOptions } from "./commerceIntegrity";

export type ProductOrderabilityReadiness = {
  productSlug: string;
  active: boolean;
  priceReady: boolean;
  mediaReady: boolean;
  categoryReady: boolean;
  optionsReady: boolean;
  availabilityReady: boolean;
  orderReady: boolean;
  reasons: string[];
};

function validPublicUrl(value: string | null | undefined) {
  return typeof value === "string" && /^https:\/\//i.test(value);
}

export function assessProductOrderability(product: {
  slug: string;
  status: string;
  basePrice: { toString(): string } | number | string;
  category?: { id?: string } | null;
  images: Array<{ publicUrl: string | null; archivedAt?: Date | null; deletedAt?: Date | null }>;
  modifiers: Array<{ required: boolean; options: unknown }>;
  pricingRules: Array<{ startsAt: Date | null; endsAt: Date | null; price: { toString(): string } | number | string }>;
  availabilityRules: Array<{ dayOfWeek: number | null; startsAt: string | null; endsAt: string | null; isAvailable: boolean }>;
}, now = new Date()): ProductOrderabilityReadiness {
  const active = product.status === "ACTIVE";
  const basePrice = decimalNumber(product.basePrice);
  const currentPrice = currentCatalogPrice(product.basePrice, product.pricingRules, now);
  const priceReady = Number.isFinite(basePrice) && basePrice > 0 && Number.isFinite(currentPrice) && currentPrice > 0;
  const mediaReady = product.images.some((image) => image.archivedAt == null && image.deletedAt == null && validPublicUrl(image.publicUrl));
  const categoryReady = Boolean(product.category?.id);
  const optionsReady = product.modifiers
    .filter((modifier) => modifier.required)
    .every((modifier) => normalizeCatalogModifierOptions(modifier.options).length > 0);
  const availabilityReady = catalogProductIsAvailable(product.availabilityRules, now);
  const reasons: string[] = [];
  if (!active) reasons.push("PRODUCT_NOT_ACTIVE");
  if (!priceReady) reasons.push("PRICE_NOT_READY");
  if (!mediaReady) reasons.push("MEDIA_NOT_READY");
  if (!categoryReady) reasons.push("CATEGORY_NOT_READY");
  if (!optionsReady) reasons.push("OPTIONS_NOT_READY");
  if (!availabilityReady) reasons.push("PRODUCT_NOT_AVAILABLE_NOW");
  return {
    productSlug: product.slug,
    active,
    priceReady,
    mediaReady,
    categoryReady,
    optionsReady,
    availabilityReady,
    orderReady: reasons.length === 0,
    reasons
  };
}

export async function assertCatalogItemsOrderable(
  productSlugs: string[],
  authContext: PrismaAuthContext = SYSTEM_AUTH_CONTEXT
) {
  const uniqueSlugs = [...new Set(productSlugs)];
  return withPrismaAuthContext(authContext, async (db) => {
    const products = await db.catalogProduct.findMany({
      where: { brandKey: "SALORA", slug: { in: uniqueSlugs } },
      include: {
        category: true,
        images: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        modifiers: true,
        pricingRules: true,
        availabilityRules: true
      }
    });
    if (products.length !== uniqueSlugs.length) {
      throw new Error("One or more requested SALORA products do not exist.");
    }
    const readiness = products.map((product) => assessProductOrderability(product));
    const blocked = readiness.filter((item) => !item.orderReady);
    if (blocked.length > 0) {
      const error = new Error(`Products are not order-ready: ${blocked.map((item) => `${item.productSlug}[${item.reasons.join(",")}]`).join("; ")}`);
      error.name = "ProductOrderabilityError";
      throw error;
    }
    return readiness;
  });
}

export async function catalogOrderabilitySnapshot(authContext: PrismaAuthContext = SYSTEM_AUTH_CONTEXT) {
  return withPrismaAuthContext(authContext, async (db) => {
    const products = await db.catalogProduct.findMany({
      where: { brandKey: "SALORA" },
      orderBy: { name: "asc" },
      include: {
        category: true,
        images: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        modifiers: true,
        pricingRules: true,
        availabilityRules: true
      }
    });
    return products.map((product) => assessProductOrderability(product));
  });
}
