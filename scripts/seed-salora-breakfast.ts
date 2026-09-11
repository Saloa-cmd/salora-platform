import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";
import { breakfastCategory, breakfastMenu } from "../packages/data/src/breakfast.ts";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Breakfast seed requires DIRECT_URL or DATABASE_URL.");
}

const requestedStatus = process.env.SALORA_BREAKFAST_STATUS ?? "DRAFT";
if (requestedStatus !== "DRAFT" && requestedStatus !== "ACTIVE") {
  throw new Error("SALORA_BREAKFAST_STATUS must be DRAFT or ACTIVE.");
}

const publicBaseUrl = (process.env.SALORA_PUBLIC_BASE_URL ?? "https://salora-platform.vercel.app").replace(/\/$/, "");
const actorId = process.env.SALORA_BREAKFAST_ACTOR_ID ?? "00000000-0000-0000-0000-000000000022";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  const result = await prisma.$transaction(async (database) => {
    const category = await database.productCategory.upsert({
      where: { slug: breakfastCategory.slug },
      create: {
        brandKey: "SALORA",
        slug: breakfastCategory.slug,
        name: breakfastCategory.nameEn,
        nameAr: breakfastCategory.nameAr,
        nameEn: breakfastCategory.nameEn,
        sortOrder: breakfastCategory.sortOrder
      },
      update: {
        brandKey: "SALORA",
        name: breakfastCategory.nameEn,
        nameAr: breakfastCategory.nameAr,
        nameEn: breakfastCategory.nameEn,
        sortOrder: breakfastCategory.sortOrder
      }
    });

    const productIds = new Map<string, string>();

    for (const [index, item] of breakfastMenu.entries()) {
      const product = await database.catalogProduct.upsert({
        where: { slug: item.slug },
        create: {
          brandKey: "SALORA",
          categoryId: category.id,
          slug: item.slug,
          name: item.nameEn,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          description: item.descriptionEn,
          descriptionAr: item.descriptionAr,
          descriptionEn: item.descriptionEn,
          status: requestedStatus,
          basePrice: item.price,
          tags: ["breakfast", `breakfast-${item.group}`, ...(item.featured ? ["signature"] : [])],
          pairingHint: item.group === "platters" ? "شاي سالورا | SALORA tea" : null,
          aiDescriptor: `SALORA breakfast ${item.group}: ${item.nameEn}`
        },
        update: {
          brandKey: "SALORA",
          categoryId: category.id,
          name: item.nameEn,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          description: item.descriptionEn,
          descriptionAr: item.descriptionAr,
          descriptionEn: item.descriptionEn,
          status: requestedStatus,
          basePrice: item.price,
          tags: ["breakfast", `breakfast-${item.group}`, ...(item.featured ? ["signature"] : [])],
          pairingHint: item.group === "platters" ? "شاي سالورا | SALORA tea" : null,
          aiDescriptor: `SALORA breakfast ${item.group}: ${item.nameEn}`
        }
      });
      productIds.set(item.slug, product.id);

      const storagePath = item.asset.replace(/^\//, "");
      const publicUrl = `${publicBaseUrl}${item.asset}`;
      const existingImage = await database.productImage.findFirst({
        where: { productId: product.id, storagePath, deletedAt: null, archivedAt: null }
      });
      if (existingImage) {
        await database.productImage.update({
          where: { id: existingImage.id },
          data: {
            publicUrl,
            altText: `${item.nameAr} — ${item.nameEn}`,
            isPrimary: true,
            sortOrder: 0,
            metadata: { source: "application_asset", menu: "breakfast", group: item.group }
          }
        });
      } else {
        await database.productImage.create({
          data: {
            productId: product.id,
            storageBucket: "application-assets",
            storagePath,
            publicUrl,
            altText: `${item.nameAr} — ${item.nameEn}`,
            isPrimary: true,
            sortOrder: 0,
            metadata: { source: "application_asset", menu: "breakfast", group: item.group }
          }
        });
      }

      for (const addon of item.addons ?? []) {
        const existingAddon = await database.productAddon.findFirst({
          where: { productId: product.id, name: addon.name }
        });
        if (existingAddon) {
          await database.productAddon.update({ where: { id: existingAddon.id }, data: { price: addon.price } });
        } else {
          await database.productAddon.create({ data: { productId: product.id, name: addon.name, price: addon.price } });
        }
      }

      const collection = await database.menuCollection.findUnique({
        where: { brandKey_key: { brandKey: "SALORA", key: "salora-menu" } }
      });
      if (!collection) continue;

      const section = await database.menuCollectionSection.upsert({
        where: { collectionId_key: { collectionId: collection.id, key: breakfastCategory.slug } },
        create: {
          collectionId: collection.id,
          key: breakfastCategory.slug,
          nameAr: breakfastCategory.nameAr,
          nameEn: breakfastCategory.nameEn,
          descriptionAr: breakfastCategory.descriptionAr,
          descriptionEn: breakfastCategory.descriptionEn,
          sortOrder: breakfastCategory.sortOrder,
          isActive: true,
          createdBy: actorId,
          updatedBy: actorId
        },
        update: {
          nameAr: breakfastCategory.nameAr,
          nameEn: breakfastCategory.nameEn,
          descriptionAr: breakfastCategory.descriptionAr,
          descriptionEn: breakfastCategory.descriptionEn,
          sortOrder: breakfastCategory.sortOrder,
          isActive: true,
          archivedAt: null,
          updatedBy: actorId
        }
      });

      await database.menuCollectionProduct.upsert({
        where: { collectionId_productId: { collectionId: collection.id, productId: product.id } },
        create: {
          collectionId: collection.id,
          sectionId: section.id,
          productId: product.id,
          sortOrder: (index + 1) * 10,
          membershipSource: "MANUAL",
          sourceReason: "Approved SALORA breakfast launch catalog.",
          isFeatured: Boolean(item.featured),
          createdBy: actorId,
          updatedBy: actorId
        },
        update: {
          sectionId: section.id,
          sortOrder: (index + 1) * 10,
          membershipSource: "MANUAL",
          sourceReason: "Approved SALORA breakfast launch catalog.",
          isFeatured: Boolean(item.featured),
          archivedAt: null,
          updatedBy: actorId
        }
      });
    }

    return {
      categoryId: category.id,
      productCount: productIds.size,
      status: requestedStatus
    };
  });

  console.info(JSON.stringify({
    ...result,
    publication: requestedStatus === "ACTIVE"
      ? "Catalog products are active. Publish a new immutable Menu Authority revision before production customers can see them."
      : "Drafts are ready for operator review."
  }, null, 2));
}

main().finally(async () => prisma.$disconnect());
