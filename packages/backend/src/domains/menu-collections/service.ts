import { createHash, randomUUID } from "node:crypto";
import { buildMenuRevisionSnapshot, isMenuRevisionContractV2 } from "./revision-contract";
import type { PrismaAuthContext } from "../../database/rls-context";
import {
  menuCollectionCreateSchema,
  menuCollectionProductSchema,
  menuCollectionRevisionRequestSchema,
  menuCollectionSectionSchema,
  menuCollectionTransitionSchema,
  menuPublicationRequestSchema,
  menuRollbackRequestSchema,
  productAllergenProfileSchema,
  productNutritionProfileSchema
} from "./schemas";
import {
  assertMenuCollectionPermission,
  assertMenuCollectionTransition,
  calculateMenuCollectionCompleteness
} from "./policy";
import type { MenuCollectionRepository } from "./repository";

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function checksumSnapshot(snapshot: unknown): string {
  return createHash("sha256").update(stableJson(snapshot)).digest("hex");
}

function assertExpectedCollectionVersion(
  actualUpdatedAt: Date,
  expectedUpdatedAt?: Date
): void {
  if (expectedUpdatedAt && actualUpdatedAt.getTime() !== expectedUpdatedAt.getTime()) {
    throw new Error("Collection changed after the operator loaded the workspace. Refresh and retry.");
  }
}

function assertValidTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error("Publication timezone is invalid.");
  }
}

function auditData(
  action: "CREATE" | "UPDATE" | "APPROVE" | "ARCHIVE" | "RESTORE",
  entityType: string,
  entityId: string,
  actorId: string,
  before: unknown,
  after: unknown,
  reason?: string | null
) {
  return {
    action,
    entityType,
    entityId,
    actorId,
    before: before ?? undefined,
    after: after ?? undefined,
    reason: reason ?? undefined
  };
}

export class MenuCollectionDomainService {
  constructor(
    private readonly repository: MenuCollectionRepository,
    private readonly authContext: PrismaAuthContext
  ) {}

  async createCollection(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "EDIT");
    const input = menuCollectionCreateSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const collection = await database.menuCollection.create({
        data: {
          ...input,
          createdBy: actorId,
          updatedBy: actorId
        }
      });

      await database.auditLog.create({
        data: auditData("CREATE", "MenuCollection", collection.id, actorId, null, collection)
      });

      return collection;
    });
  }

  async createSection(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "EDIT");
    const input = menuCollectionSectionSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const section = await database.menuCollectionSection.create({
        data: {
          ...input,
          createdBy: actorId,
          updatedBy: actorId
        }
      });
      await database.auditLog.create({
        data: auditData("CREATE", "MenuCollectionSection", section.id, actorId, null, section)
      });
      return section;
    });
  }

  async assignProduct(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "EDIT");
    const input = menuCollectionProductSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const existing = await database.menuCollectionProduct.findUnique({
        where: {
          collectionId_productId: {
            collectionId: input.collectionId,
            productId: input.productId
          }
        }
      });

      const membership = await database.menuCollectionProduct.upsert({
        where: {
          collectionId_productId: {
            collectionId: input.collectionId,
            productId: input.productId
          }
        },
        create: {
          ...input,
          createdBy: actorId,
          updatedBy: actorId
        },
        update: {
          ...input,
          archivedAt: null,
          updatedBy: actorId
        }
      });

      await database.auditLog.create({
        data: auditData(
          existing ? "UPDATE" : "CREATE",
          "MenuCollectionProduct",
          membership.id,
          actorId,
          existing,
          membership
        )
      });

      return membership;
    });
  }

  async saveNutritionProfile(rawInput: unknown, actorId: string) {
    const input = productNutritionProfileSchema.parse(rawInput);
    const permission = input.verificationStatus === "VERIFIED" || input.verificationStatus === "REJECTED"
      ? "REVIEW_FOOD_SAFETY"
      : "EDIT";
    assertMenuCollectionPermission(this.authContext.roles, permission);

    return this.repository.run(async (database) => {
      const existing = await database.productNutritionProfile.findUnique({
        where: { productId: input.productId }
      });
      const profile = await database.productNutritionProfile.upsert({
        where: { productId: input.productId },
        create: {
          ...input,
          createdBy: actorId,
          updatedBy: actorId
        },
        update: {
          ...input,
          archivedAt: null,
          updatedBy: actorId
        }
      });
      await database.auditLog.create({
        data: auditData(
          existing ? "UPDATE" : "CREATE",
          "ProductNutritionProfile",
          profile.id,
          actorId,
          existing,
          profile
        )
      });
      return profile;
    });
  }

  async saveAllergenProfile(rawInput: unknown, actorId: string) {
    const input = productAllergenProfileSchema.parse(rawInput);
    const permission = input.verificationStatus === "VERIFIED" || input.verificationStatus === "REJECTED"
      ? "REVIEW_FOOD_SAFETY"
      : "EDIT";
    assertMenuCollectionPermission(this.authContext.roles, permission);

    return this.repository.run(async (database) => {
      const existing = await database.productAllergenProfile.findUnique({
        where: { productId: input.productId }
      });
      const profile = await database.productAllergenProfile.upsert({
        where: { productId: input.productId },
        create: {
          ...input,
          createdBy: actorId,
          updatedBy: actorId
        },
        update: {
          ...input,
          archivedAt: null,
          updatedBy: actorId
        }
      });
      await database.auditLog.create({
        data: auditData(
          existing ? "UPDATE" : "CREATE",
          "ProductAllergenProfile",
          profile.id,
          actorId,
          existing,
          profile
        )
      });
      return profile;
    });
  }

  async refreshCompleteness(collectionId: string, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "EDIT");

    return this.repository.run(async (database) => {
      const collection = await database.menuCollection.findUnique({
        where: { id: collectionId },
        include: {
          sections: { where: { archivedAt: null, isActive: true } },
          products: {
            where: { archivedAt: null },
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
        activeSectionCount: collection.sections.length,
        products: collection.products.map((membership: any) => ({
          productId: membership.productId,
          hasArabicTitle: Boolean(membership.titleArOverride || membership.product.nameAr),
          hasEnglishTitle: Boolean(membership.titleEnOverride || membership.product.nameEn),
          hasPrimaryImage: membership.product.images.length > 0,
          nutritionStatus: membership.product.nutritionProfile?.verificationStatus,
          allergenStatus: membership.product.allergenProfile?.verificationStatus
        }))
      });

      const updated = await database.menuCollection.update({
        where: { id: collectionId },
        data: {
          completenessScore: completeness.score,
          updatedBy: actorId
        }
      });

      await database.auditLog.create({
        data: auditData(
          "UPDATE",
          "MenuCollection",
          collectionId,
          actorId,
          { completenessScore: collection.completenessScore },
          { completenessScore: completeness.score, blockers: completeness.blockers },
          "Recalculated collection completeness."
        )
      });

      return { collection: updated, completeness };
    });
  }

  async createRevision(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "REVIEW_CONTENT");
    const input = menuCollectionRevisionRequestSchema.parse(rawInput);

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
      assertExpectedCollectionVersion(collection.updatedAt, input.expectedUpdatedAt);

      const latest = await database.menuCollectionRevision.findFirst({
        where: { collectionId: input.collectionId },
        orderBy: { version: "desc" },
        select: { version: true }
      });

      const snapshot = buildMenuRevisionSnapshot(collection);
      const revision = await database.menuCollectionRevision.create({
        data: {
          collectionId: input.collectionId,
          version: (latest?.version ?? 0) + 1,
          status: collection.status,
          snapshot,
          checksum: checksumSnapshot(snapshot),
          changeSummary: input.changeSummary,
          createdBy: actorId
        }
      });

      await database.auditLog.create({
        data: auditData(
          "CREATE",
          "MenuCollectionRevision",
          revision.id,
          actorId,
          null,
          { collectionId: revision.collectionId, version: revision.version, checksum: revision.checksum }
        )
      });

      return revision;
    });
  }

  async transitionCollection(rawInput: unknown, actorId: string) {
    const input = menuCollectionTransitionSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      const collection = await database.menuCollection.findUnique({
        where: { id: input.collectionId }
      });
      if (!collection) throw new Error("Menu collection was not found.");
      assertExpectedCollectionVersion(collection.updatedAt, input.expectedUpdatedAt);

      assertMenuCollectionTransition(collection.status, input.targetStatus, this.authContext.roles);

      if ((input.targetStatus === "APPROVED" || input.targetStatus === "SCHEDULED" || input.targetStatus === "PUBLISHED")
        && collection.completenessScore !== 100) {
        throw new Error("Collection completeness must be 100 before approval or publication.");
      }

      if ((input.targetStatus === "SCHEDULED" || input.targetStatus === "PUBLISHED") && !collection.activeRevisionId) {
        throw new Error("An active immutable revision is required before publication.");
      }

      const timestampData: Record<string, Date | null> = {};
      if (input.targetStatus === "PUBLISHED") timestampData.publishedAt = new Date();
      if (input.targetStatus === "PAUSED") timestampData.pausedAt = new Date();
      if (input.targetStatus === "ARCHIVED") timestampData.archivedAt = new Date();
      if (input.targetStatus === "DRAFT" && collection.status === "ARCHIVED") timestampData.archivedAt = null;

      const updated = await database.menuCollection.update({
        where: { id: input.collectionId },
        data: {
          status: input.targetStatus,
          ...timestampData,
          updatedBy: actorId
        }
      });

      const action = input.targetStatus === "APPROVED"
        ? "APPROVE"
        : input.targetStatus === "ARCHIVED"
          ? "ARCHIVE"
          : collection.status === "ARCHIVED" && input.targetStatus === "DRAFT"
            ? "RESTORE"
            : "UPDATE";

      await database.auditLog.create({
        data: auditData(
          action,
          "MenuCollection",
          input.collectionId,
          actorId,
          { status: collection.status },
          { status: input.targetStatus },
          input.reason
        )
      });

      return updated;
    });
  }

  async schedulePublication(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "PUBLISH");
    const input = menuPublicationRequestSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      // `repository.run` supplies one interactive transaction client. node-postgres
      // does not support concurrent queries on that client, so transaction reads
      // must remain explicitly ordered.
      const collection = await database.menuCollection.findUnique({
        where: { id: input.collectionId }
      });
      const revision = await database.menuCollectionRevision.findUnique({
        where: { id: input.revisionId }
      });
      if (!collection || !revision || revision.collectionId !== input.collectionId) {
        throw new Error("Collection and revision do not match.");
      }
      assertExpectedCollectionVersion(collection.updatedAt, input.expectedUpdatedAt);
      assertValidTimezone(input.timezone);
      if (!isMenuRevisionContractV2(revision.snapshot)) {
        throw new Error("Only a canonical contractVersion 2 revision can be published.");
      }
      if (collection.completenessScore !== 100) {
        throw new Error("Collection completeness must be 100 before scheduling publication.");
      }
      if (input.scheduledAt && input.scheduledAt.getTime() <= Date.now() + 60_000) {
        throw new Error("Scheduled publication must be at least one minute in the future.");
      }

      const publication = await database.menuPublication.create({
        data: {
          collectionId: input.collectionId,
          revisionId: input.revisionId,
          publicationKey: input.publicationKey,
          status: input.scheduledAt ? "SCHEDULED" : "PUBLISHED",
          channels: input.channels,
          scheduledAt: input.scheduledAt,
          publishedAt: input.scheduledAt ? null : new Date(),
          completedAt: input.scheduledAt ? null : new Date(),
          smokeTestStatus: input.scheduledAt ? null : "PENDING",
          createdBy: actorId
        }
      });

      await database.menuCollection.update({
        where: { id: input.collectionId },
        data: {
          activeRevisionId: input.revisionId,
          status: input.scheduledAt ? "SCHEDULED" : "PUBLISHED",
          scheduledAt: input.scheduledAt,
          publishedAt: input.scheduledAt ? collection.publishedAt : new Date(),
          updatedBy: actorId
        }
      });

      await database.auditLog.create({
        data: auditData(
          "CREATE",
          "MenuPublication",
          publication.id,
          actorId,
          null,
          publication,
          input.scheduledAt ? "Scheduled menu collection publication." : "Published menu collection immediately."
        )
      });

      return publication;
    });
  }

  async rollbackPublication(rawInput: unknown, actorId: string) {
    assertMenuCollectionPermission(this.authContext.roles, "ROLLBACK");
    const input = menuRollbackRequestSchema.parse(rawInput);

    return this.repository.run(async (database) => {
      // Keep reads on this interactive transaction client sequential. Parallel
      // Prisma calls here enqueue multiple queries on one pg.Client.
      const target = await database.menuPublication.findUnique({
        where: { id: input.targetPublicationId },
        include: { revision: true }
      });
      const collection = await database.menuCollection.findUnique({
        where: { id: input.collectionId }
      });
      if (!target || !collection || target.collectionId !== input.collectionId) {
        throw new Error("Rollback target does not belong to the collection.");
      }
      assertExpectedCollectionVersion(collection.updatedAt, input.expectedUpdatedAt);
      if (!isMenuRevisionContractV2(target.revision.snapshot)) {
        throw new Error("Rollback target must use the canonical contractVersion 2 revision.");
      }

      const current = await database.menuPublication.findFirst({
        where: { collectionId: input.collectionId, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" }
      });

      if (current) {
        await database.menuPublication.update({
          where: { id: current.id },
          data: { status: "ROLLED_BACK", rolledBackAt: new Date() }
        });
      }

      const rollback = await database.menuPublication.create({
        data: {
          collectionId: input.collectionId,
          revisionId: target.revisionId,
          publicationKey: `${input.collectionId}:rollback:${randomUUID()}`,
          status: "PUBLISHED",
          channels: target.channels,
          publishedAt: new Date(),
          completedAt: new Date(),
          smokeTestStatus: "PENDING",
          rollbackOfId: current?.id ?? null,
          createdBy: actorId
        }
      });

      await database.menuCollection.update({
        where: { id: input.collectionId },
        data: {
          activeRevisionId: target.revisionId,
          status: "PUBLISHED",
          publishedAt: new Date(),
          pausedAt: null,
          updatedBy: actorId
        }
      });

      await database.auditLog.create({
        data: auditData(
          "RESTORE",
          "MenuPublication",
          rollback.id,
          actorId,
          current,
          rollback,
          input.reason
        )
      });

      return rollback;
    });
  }
}
