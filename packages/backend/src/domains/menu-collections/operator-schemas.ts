import { z } from "zod";
import { MENU_CHANNELS } from "./types";

const uuidSchema = z.string().uuid();
const versionSchema = z.coerce.date();
const orderedItemSchema = z.object({
  id: uuidSchema,
  sortOrder: z.number().int().min(0).max(100000)
});

function uniqueOrdering(
  value: { items: Array<{ id: string; sortOrder: number }> },
  context: z.RefinementCtx
) {
  if (new Set(value.items.map((item) => item.id)).size !== value.items.length) {
    context.addIssue({ code: "custom", message: "Ordering items must have unique IDs." });
  }
  if (new Set(value.items.map((item) => item.sortOrder)).size !== value.items.length) {
    context.addIssue({ code: "custom", message: "Ordering items must have unique sort positions." });
  }
}

export const menuOperatorCollectionSchema = z.object({
  collectionId: uuidSchema,
  revisionId: uuidSchema.optional()
});

export const menuRevisionDiffSchema = z.object({
  collectionId: uuidSchema,
  leftRevisionId: uuidSchema,
  rightRevisionId: uuidSchema
}).refine((value) => value.leftRevisionId !== value.rightRevisionId, {
  message: "Choose two different revisions."
});

export const menuSectionReorderSchema = z.object({
  collectionId: uuidSchema,
  expectedUpdatedAt: versionSchema,
  items: z.array(orderedItemSchema).min(1).max(100)
}).superRefine(uniqueOrdering);

export const menuProductReorderSchema = z.object({
  collectionId: uuidSchema,
  sectionId: uuidSchema.nullable(),
  expectedUpdatedAt: versionSchema,
  items: z.array(orderedItemSchema).min(1).max(500)
}).superRefine(uniqueOrdering);

const bulkOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SET_FEATURED"),
    isFeatured: z.boolean()
  }),
  z.object({
    type: z.literal("MOVE_SECTION"),
    sectionId: uuidSchema
  }),
  z.object({
    type: z.literal("SET_VISIBILITY"),
    visible: z.boolean()
  })
]);

export const menuBulkMembershipSchema = z.object({
  collectionId: uuidSchema,
  expectedUpdatedAt: versionSchema,
  membershipIds: z.array(uuidSchema).min(1).max(117)
    .refine((items) => new Set(items).size === items.length, "Membership IDs must be unique."),
  operation: bulkOperationSchema,
  reason: z.string().trim().min(3).max(1000)
});

export const menuOperatorPublicationSchema = z.object({
  collectionId: uuidSchema,
  revisionId: uuidSchema,
  publicationKey: z.string().trim().min(8).max(160),
  channels: z.array(z.enum(MENU_CHANNELS)).min(1),
  scheduledAt: z.coerce.date().nullable().optional(),
  timezone: z.string().trim().min(1).max(80).default("Asia/Muscat"),
  expectedUpdatedAt: versionSchema
});

export const menuOperatorRollbackSchema = z.object({
  collectionId: uuidSchema,
  targetPublicationId: uuidSchema,
  reason: z.string().trim().min(3).max(1000),
  expectedUpdatedAt: versionSchema
});
