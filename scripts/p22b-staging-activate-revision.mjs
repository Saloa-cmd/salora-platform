import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";
import {
  buildMenuRevisionSnapshot,
  isMenuRevisionContractV2
} from "../packages/backend/src/domains/menu-collections/revision-contract.ts";

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

assert.equal(process.env.SALORA_ENVIRONMENT, "staging", "Activation is restricted to staging.");
assert.equal(
  process.env.ALLOW_STAGING_MENU_AUTHORITY_WRITE,
  "true",
  "Explicit staging write approval is required."
);

const expectedRef = required("SALORA_EXPECTED_SUPABASE_PROJECT_REF");
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is required.");
assert.ok(
  connectionString.includes(expectedRef),
  "Database connection does not match the expected staging project."
);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const result = await prisma.$transaction(async (database) => {
    const collection = await database.menuCollection.findFirst({
      where: {
        brandKey: "SALORA",
        key: "salora-menu",
        archivedAt: null
      },
      include: {
        activeRevision: true,
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
    if (!collection) throw new Error("SALORA Staging collection was not found.");
    if (collection.status !== "PUBLISHED") {
      throw new Error("Staging collection must already be published before authority-contract activation.");
    }

    const snapshot = buildMenuRevisionSnapshot(collection);
    const checksum = createHash("sha256").update(stableJson(snapshot)).digest("hex");

    if (
      collection.activeRevision
      && isMenuRevisionContractV2(collection.activeRevision.snapshot)
      && collection.activeRevision.checksum === checksum
    ) {
      return {
        action: "NO_OP",
        revisionId: collection.activeRevision.id,
        version: collection.activeRevision.version,
        checksum
      };
    }

    const latest = await database.menuCollectionRevision.findFirst({
      where: { collectionId: collection.id },
      orderBy: { version: "desc" },
      select: { version: true }
    });
    const actorId = process.env.SALORA_STAGING_ACTOR_ID?.trim() || collection.updatedBy;

    const revision = await database.menuCollectionRevision.create({
      data: {
        collectionId: collection.id,
        version: (latest?.version ?? 0) + 1,
        status: "PUBLISHED",
        snapshot,
        checksum,
        changeSummary: "P22B canonical contractVersion 2 activation for isolated Staging required-mode certification.",
        createdBy: actorId
      }
    });

    await database.menuCollection.update({
      where: { id: collection.id },
      data: {
        activeRevisionId: revision.id,
        updatedBy: actorId
      }
    });

    await database.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "MenuCollection",
        entityId: collection.id,
        actorId,
        before: {
          activeRevisionId: collection.activeRevisionId,
          activeRevisionVersion: collection.activeRevision?.version ?? null
        },
        after: {
          activeRevisionId: revision.id,
          activeRevisionVersion: revision.version,
          contractVersion: 2,
          checksum
        },
        reason: "Isolated Staging activation for P22B required-mode certification. Not a production publication."
      }
    });

    return {
      action: "ACTIVATED",
      revisionId: revision.id,
      version: revision.version,
      checksum
    };
  });

  console.log("SALORA P22B Staging authority activation completed:");
  console.log(JSON.stringify(result, null, 2));
  console.log("No production project, migration, publication record, or deployment was modified.");
} finally {
  await prisma.$disconnect();
}
