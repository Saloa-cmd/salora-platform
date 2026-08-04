import type { PrismaAuthContext } from "../../database/rls-context";
import { buildMenuRevisionSnapshot, isMenuRevisionContractV2 } from "./revision-contract";
import { diffMenuRevisionSnapshots } from "./revision-diff";
import {
  menuBulkMembershipSchema,
  menuOperatorCollectionSchema,
  menuProductReorderSchema,
  menuRevisionDiffSchema,
  menuSectionReorderSchema
} from "./operator-schemas";
import {
  assertMenuCollectionPermission,
  calculateMenuCollectionCompleteness
} from "./policy";
import type { MenuCollectionRepository } from "./repository";

function auditData(
  entityType: string,
  entityId: string,
  actorId: string,
  before: unknown,
  after: unknown,
  reason: string
) {
  return {
    action: "UPDATE" as const,
    entityType,
    entityId,
    actorId,
    before: before ?? undefined,
    after: after ?? undefined,
    reason
  };
}

function sameTimestamp(actual: Date, expected: Date): boolean {
  return actual.getTime() === expected.getTime();
}

function assertExactSet(actual: string[], expected: string[], label: string) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  if (
    actualSet.size !== expectedSet.size
    || actual.some((id) => !expectedSet.has(id))
    || expected.some((id) => !actualSet.has(id))
  ) {
    throw new Error(`${label} changed after the operator loaded the workspace. Refresh and retry.`);
  }
}

export class MenuCollectionOperatorService {
  constructor(
    private readonly repository: MenuCollectionRepository,
    private readonly authContext: PrismaAuthContext
  ) {}

  private async collectionForVersion(database: any, collectionId: string, expectedUpdatedAt: Date) {
    const collection = await database.menuCollection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new Error("Menu collection was not found.");
    if (!sameTimestamp(collection.updatedAt, expectedUpdatedAt)) {
      throw new Error("MENU_AUTHORITY_CONFLICT: the collection changed. Refresh before saving.");
    }
    return collection;
  }

  async validateCollection(rawInput: unknown) {
    assertMenuCollectionPermission(this.authContext.roles, "VIEW");
    const input = menuOperatorCollectionSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const collection = await database.menuCollection.findUnique({
        where: { id: input.collectionId },
        include: {
          activeRevision: true,
          ...(input.revisionId
            ? {
                revisions: {
                  where: { id: input.revisionId },
                  take: 1
                }
              }
            : {}),
          sections: {
            where: { archivedAt: null },
            orderBy: [{ sortOrder: "asc" }, { key: "asc" }]
          },
          products: {
            where: { archivedAt: null },
            orderBy: [{ sortOrder: "asc" }, { productId: "asc" }],
            include: {
              product: {
                include: {
                  images: {
                    where: { deletedAt: null, archivedAt: null, isPrimary: true },
                    take: 1
                  },
                  nutritionProfile: true,
                  allergenProfile: true
                }
              }
            }
          }
        }
      });
      if (!collection) throw new Error("Menu collection was not found.");

      const completeness = calculateMenuCollectionCompleteness({
        kind: collection.kind,
        nameAr: collection.nameAr,
        nameEn: collection.nameEn,
        descriptionAr: collection.descriptionAr,
        descriptionEn: collection.descriptionEn,
        activeSectionCount: collection.sections.filter((section: any) => section.isActive).length,
        products: collection.products.map((membership: any) => ({
          productId: membership.productId,
          hasArabicTitle: Boolean(membership.titleArOverride || membership.product.nameAr),
          hasEnglishTitle: Boolean(membership.titleEnOverride || membership.product.nameEn),
          hasPrimaryImage: membership.product.images.length > 0,
          nutritionStatus: membership.product.nutritionProfile?.verificationStatus,
          allergenStatus: membership.product.allergenProfile?.verificationStatus
        }))
      });

      const blockers = [...completeness.blockers];
      const warnings: string[] = [];
      const sectionOrders = collection.sections.map((section: any) => section.sortOrder);
      if (new Set(sectionOrders).size !== sectionOrders.length) blockers.push("DUPLICATE_SECTION_ORDER");

      for (const section of collection.sections) {
        const orders = collection.products
          .filter((membership: any) => membership.sectionId === section.id)
          .map((membership: any) => membership.sortOrder);
        if (new Set(orders).size !== orders.length) blockers.push(`DUPLICATE_PRODUCT_ORDER:${section.key}`);
      }

      const orphanMemberships = collection.products.filter((membership: any) =>
        membership.sectionId && !collection.sections.some((section: any) => section.id === membership.sectionId)
      );
      if (orphanMemberships.length) blockers.push("ORPHAN_SECTION_MEMBERSHIPS");

      const invalidActivePrices = collection.products.filter((membership: any) =>
        membership.product.status === "ACTIVE" && Number(membership.product.basePrice) <= 0
      );
      if (invalidActivePrices.length) blockers.push("ACTIVE_PRODUCT_PRICE_INVALID");

      const draftCount = collection.products.filter((membership: any) => membership.product.status === "DRAFT").length;
      if (draftCount) warnings.push(`${draftCount} draft catalog products remain hidden from public channels.`);

      const targetRevision = input.revisionId
        ? collection.revisions[0] ?? null
        : collection.activeRevision;
      const canonicalTargetRevision = Boolean(
        targetRevision && isMenuRevisionContractV2(targetRevision.snapshot)
      );
      if (targetRevision && !canonicalTargetRevision) {
        blockers.push("TARGET_REVISION_CONTRACT_LEGACY");
      }
      if (!targetRevision) warnings.push(
        input.revisionId ? "Selected revision was not found." : "No active revision is selected."
      );

      const uniqueBlockers = [...new Set(blockers)];
      return {
        collectionId: collection.id,
        updatedAt: collection.updatedAt,
        counts: {
          sections: collection.sections.length,
          memberships: collection.products.length,
          activeProducts: collection.products.filter((item: any) => item.product.status === "ACTIVE").length,
          draftProducts: draftCount
        },
        completeness,
        canonicalActiveRevision: canonicalTargetRevision,
        blockers: uniqueBlockers,
        warnings,
        validForRevision: uniqueBlockers.every((blocker) =>
          blocker === "TARGET_REVISION_CONTRACT_LEGACY"
          || blocker === "PRODUCT_PRIMARY_IMAGE_INCOMPLETE"
        ),
        validForPublication: completeness.score === 100
          && uniqueBlockers.length === 0
          && canonicalTargetRevision
      };
    });
  }

  async previewCollection(rawInput: unknown) {
    assertMenuCollectionPermission(this.authContext.roles, "VIEW");
    const input = menuOperatorCollectionSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const collection = await database.menuCollection.findUnique({
        where: { id: input.collectionId },
        include: {
          sections: {
            where: { archivedAt: null },
            orderBy: { sortOrder: "asc" }
          },
          products: {
            where: { archivedAt: null },
            orderBy: { sortOrder: "asc" },
            include: {
              product: {
                include: {
                  category: true,
                  nutritionProfile: true,
                  allergenProfile: true,
                  images: {
                    where: { deletedAt: null, archivedAt: null },
                    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }]
                  },
                  variants: { orderBy: { name: "asc" } },
                  addons: { orderBy: { name: "asc" } },
                  modifiers: { orderBy: { name: "asc" } },
                  pricingRules: true,
                  availabilityRules: true
                }
              }
            }
          }
        }
      });
      if (!collection) throw new Error("Menu collection was not found.");
      return buildMenuRevisionSnapshot(collection);
    });
  }

  async diffRevisions(rawInput: unknown) {
    assertMenuCollectionPermission(this.authContext.roles, "VIEW");
    const input = menuRevisionDiffSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const revisions = await database.menuCollectionRevision.findMany({
        where: {
          collectionId: input.collectionId,
          id: { in: [input.leftRevisionId, input.rightRevisionId] }
        }
      });
      const left = revisions.find((revision: any) => revision.id === input.leftRevisionId);
      const right = revisions.find((revision: any) => revision.id === input.rightRevisionId);
      if (!left || !right) throw new Error("Both revisions must belong to the selected collection.");

      return {
        left: {
          id: left.id,
          version: left.version,
          checksum: left.checksum,
          createdAt: left.createdAt
        },
        right: {
          id: right.id,
          version: right.version,
          checksum: right.checksum,
          createdAt: right.createdAt
        },
        diff: diffMenuRevisionSnapshots(left.snapshot, right.snapshot)
      };
    });
  }

  async reorderSections(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "EDIT");
    const input = menuSectionReorderSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const collection = await this.collectionForVersion(
        database,
        input.collectionId,
        input.expectedUpdatedAt
      );
      const sections = await database.menuCollectionSection.findMany({
        where: { collectionId: input.collectionId, archivedAt: null },
        orderBy: { sortOrder: "asc" }
      });
      assertExactSet(
        sections.map((section: any) => section.id),
        input.items.map((item) => item.id),
        "Section ordering"
      );

      for (const item of input.items) {
        await database.menuCollectionSection.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder, updatedBy: actorId }
        });
      }
      const updated = await database.menuCollection.update({
        where: { id: input.collectionId },
        data: { updatedBy: actorId }
      });
      await database.auditLog.create({
        data: auditData(
          "MenuCollection",
          input.collectionId,
          actorId,
          sections.map((section: any) => ({ id: section.id, sortOrder: section.sortOrder })),
          input.items,
          "Reordered menu collection sections with optimistic concurrency."
        )
      });
      return { collection: updated, items: input.items, previousUpdatedAt: collection.updatedAt };
    });
  }

  async reorderProducts(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "EDIT");
    const input = menuProductReorderSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const collection = await this.collectionForVersion(
        database,
        input.collectionId,
        input.expectedUpdatedAt
      );
      const memberships = await database.menuCollectionProduct.findMany({
        where: {
          collectionId: input.collectionId,
          sectionId: input.sectionId,
          archivedAt: null
        },
        orderBy: { sortOrder: "asc" }
      });
      assertExactSet(
        memberships.map((membership: any) => membership.id),
        input.items.map((item) => item.id),
        "Product ordering"
      );

      for (const item of input.items) {
        await database.menuCollectionProduct.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder, updatedBy: actorId }
        });
      }
      const updated = await database.menuCollection.update({
        where: { id: input.collectionId },
        data: { updatedBy: actorId }
      });
      await database.auditLog.create({
        data: auditData(
          "MenuCollection",
          input.collectionId,
          actorId,
          memberships.map((membership: any) => ({ id: membership.id, sortOrder: membership.sortOrder })),
          input.items,
          "Reordered menu products with optimistic concurrency."
        )
      });
      return { collection: updated, items: input.items, previousUpdatedAt: collection.updatedAt };
    });
  }

  async bulkMemberships(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "EDIT");
    const input = menuBulkMembershipSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const collection = await this.collectionForVersion(
        database,
        input.collectionId,
        input.expectedUpdatedAt
      );
      const memberships = await database.menuCollectionProduct.findMany({
        where: {
          collectionId: input.collectionId,
          id: { in: input.membershipIds }
        }
      });
      assertExactSet(
        memberships.map((membership: any) => membership.id),
        input.membershipIds,
        "Bulk membership selection"
      );

      if (input.operation.type === "MOVE_SECTION") {
        const section = await database.menuCollectionSection.findFirst({
          where: {
            id: input.operation.sectionId,
            collectionId: input.collectionId,
            archivedAt: null,
            isActive: true
          }
        });
        if (!section) throw new Error("The target section is not active in this collection.");
        const last = await database.menuCollectionProduct.findFirst({
          where: {
            collectionId: input.collectionId,
            sectionId: input.operation.sectionId,
            archivedAt: null,
            id: { notIn: input.membershipIds }
          },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true }
        });
        const startOrder = last?.sortOrder ?? 0;
        for (const [index, membershipId] of input.membershipIds.entries()) {
          await database.menuCollectionProduct.update({
            where: { id: membershipId },
            data: {
              sectionId: input.operation.sectionId,
              sortOrder: startOrder + ((index + 1) * 10),
              updatedBy: actorId
            }
          });
        }
      } else if (input.operation.type === "SET_FEATURED") {
        await database.menuCollectionProduct.updateMany({
          where: { id: { in: input.membershipIds }, collectionId: input.collectionId },
          data: {
            isFeatured: input.operation.isFeatured,
            updatedBy: actorId
          }
        });
      } else {
        await database.menuCollectionProduct.updateMany({
          where: { id: { in: input.membershipIds }, collectionId: input.collectionId },
          data: {
            archivedAt: input.operation.visible ? null : new Date(),
            updatedBy: actorId
          }
        });
      }

      const updated = await database.menuCollection.update({
        where: { id: input.collectionId },
        data: { updatedBy: actorId }
      });
      await database.auditLog.create({
        data: auditData(
          "MenuCollection",
          input.collectionId,
          actorId,
          memberships,
          { membershipIds: input.membershipIds, operation: input.operation },
          input.reason
        )
      });

      return {
        collection: updated,
        affected: input.membershipIds.length,
        operation: input.operation,
        previousUpdatedAt: collection.updatedAt
      };
    });
  }
}
