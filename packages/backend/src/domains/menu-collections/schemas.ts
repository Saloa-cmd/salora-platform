import { z } from "zod";
import {
  FOOD_DATA_VERIFICATION_STATUSES,
  MENU_CHANNELS,
  MENU_COLLECTION_KINDS,
  MENU_COLLECTION_STATUSES,
  MENU_MEMBERSHIP_SOURCES
} from "./types";

const uuidSchema = z.string().uuid();
const optionalText = z.string().trim().max(4000).nullable().optional();
const nonNegativeNullableNumber = z.number().finite().nonnegative().nullable().optional();

export const menuCollectionCreateSchema = z.object({
  brandKey: z.literal("SALORA").default("SALORA"),
  key: z.string().trim().min(2).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9][a-z0-9-]*$/),
  kind: z.enum(MENU_COLLECTION_KINDS),
  nameAr: z.string().trim().min(2).max(160),
  nameEn: z.string().trim().min(2).max(160),
  descriptionAr: optionalText,
  descriptionEn: optionalText,
  accentTokens: z.record(z.string(), z.unknown()).default({}),
  coverMedia: z.record(z.string(), z.unknown()).nullable().optional(),
  banner: z.record(z.string(), z.unknown()).nullable().optional(),
  channels: z.array(z.enum(MENU_CHANNELS)).min(1).default(["WEB", "DIGITAL_MENU", "MOBILE"])
});

export const menuCollectionSectionSchema = z.object({
  collectionId: uuidSchema,
  key: z.string().trim().min(2).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/),
  nameAr: z.string().trim().min(2).max(160),
  nameEn: z.string().trim().min(2).max(160),
  descriptionAr: optionalText,
  descriptionEn: optionalText,
  sortOrder: z.number().int().min(0).max(10000).default(0),
  membershipRule: z.record(z.string(), z.unknown()).nullable().optional(),
  isActive: z.boolean().default(true)
});

export const menuCollectionProductSchema = z.object({
  collectionId: uuidSchema,
  sectionId: uuidSchema.nullable().optional(),
  productId: uuidSchema,
  sortOrder: z.number().int().min(0).max(100000).default(0),
  titleArOverride: z.string().trim().min(2).max(160).nullable().optional(),
  titleEnOverride: z.string().trim().min(2).max(160).nullable().optional(),
  descriptionArOverride: optionalText,
  descriptionEnOverride: optionalText,
  presentationImage: z.record(z.string(), z.unknown()).nullable().optional(),
  badges: z.array(z.string().trim().min(1).max(40)).max(2).default([]),
  membershipSource: z.enum(MENU_MEMBERSHIP_SOURCES).default("MANUAL"),
  membershipRuleKey: z.string().trim().max(120).nullable().optional(),
  sourceReason: optionalText,
  isFeatured: z.boolean().default(false)
});

export const productNutritionProfileSchema = z.object({
  productId: uuidSchema,
  servingLabelAr: z.string().trim().max(120).nullable().optional(),
  servingLabelEn: z.string().trim().max(120).nullable().optional(),
  servingAmount: nonNegativeNullableNumber,
  servingUnit: z.string().trim().max(32).nullable().optional(),
  caloriesKcal: nonNegativeNullableNumber,
  proteinG: nonNegativeNullableNumber,
  carbohydratesG: nonNegativeNullableNumber,
  totalSugarG: nonNegativeNullableNumber,
  addedSugarG: nonNegativeNullableNumber,
  fatG: nonNegativeNullableNumber,
  saturatedFatG: nonNegativeNullableNumber,
  sodiumMg: nonNegativeNullableNumber,
  caffeineMg: nonNegativeNullableNumber,
  plantBased: z.boolean().nullable().optional(),
  sourceType: z.string().trim().max(80).nullable().optional(),
  sourceReference: optionalText,
  recipeVersion: z.string().trim().max(80).nullable().optional(),
  verificationStatus: z.enum(FOOD_DATA_VERIFICATION_STATUSES).default("DRAFT"),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
  reviewedBy: uuidSchema.nullable().optional(),
  reviewedAt: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional()
}).superRefine((value, context) => {
  if (value.verificationStatus === "VERIFIED") {
    if (!value.sourceType || !value.sourceReference || !value.recipeVersion) {
      context.addIssue({
        code: "custom",
        message: "Verified nutrition data requires source type, source reference, and recipe version."
      });
    }
    if (!value.reviewedBy || !value.reviewedAt) {
      context.addIssue({
        code: "custom",
        message: "Verified nutrition data requires a reviewer and review timestamp."
      });
    }
  }
});

export const productAllergenProfileSchema = z.object({
  productId: uuidSchema,
  containsAllergens: z.array(z.string().trim().min(1).max(80)).max(32).default([]),
  mayContainAllergens: z.array(z.string().trim().min(1).max(80)).max(32).default([]),
  declaredFreeFrom: z.array(z.string().trim().min(1).max(80)).max(32).default([]),
  ingredientVersion: z.string().trim().max(80).nullable().optional(),
  crossContactAssessment: optionalText,
  warningAr: optionalText,
  warningEn: optionalText,
  sourceType: z.string().trim().max(80).nullable().optional(),
  sourceReference: optionalText,
  verificationStatus: z.enum(FOOD_DATA_VERIFICATION_STATUSES).default("DRAFT"),
  reviewedBy: uuidSchema.nullable().optional(),
  reviewedAt: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional()
}).superRefine((value, context) => {
  if (value.verificationStatus === "VERIFIED") {
    if (!value.sourceType || !value.sourceReference || !value.ingredientVersion) {
      context.addIssue({
        code: "custom",
        message: "Verified allergen data requires source type, source reference, and ingredient version."
      });
    }
    if (!value.reviewedBy || !value.reviewedAt) {
      context.addIssue({
        code: "custom",
        message: "Verified allergen data requires a reviewer and review timestamp."
      });
    }
  }
  const declared = new Set(value.declaredFreeFrom.map((item) => item.toLowerCase()));
  for (const allergen of [...value.containsAllergens, ...value.mayContainAllergens]) {
    if (declared.has(allergen.toLowerCase())) {
      context.addIssue({
        code: "custom",
        message: `Allergen '${allergen}' cannot be both declared free-from and present/may-contain.`
      });
    }
  }
});

export const menuCollectionTransitionSchema = z.object({
  collectionId: uuidSchema,
  targetStatus: z.enum(MENU_COLLECTION_STATUSES),
  reason: z.string().trim().min(3).max(1000)
});

export const menuCollectionRevisionRequestSchema = z.object({
  collectionId: uuidSchema,
  changeSummary: z.string().trim().min(3).max(500).nullable().optional()
});

export const menuPublicationRequestSchema = z.object({
  collectionId: uuidSchema,
  revisionId: uuidSchema,
  publicationKey: z.string().trim().min(8).max(160),
  channels: z.array(z.enum(MENU_CHANNELS)).min(1),
  scheduledAt: z.coerce.date().nullable().optional()
});

export const menuRollbackRequestSchema = z.object({
  collectionId: uuidSchema,
  targetPublicationId: uuidSchema,
  reason: z.string().trim().min(3).max(1000)
});
