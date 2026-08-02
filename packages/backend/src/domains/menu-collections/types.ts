export const MENU_COLLECTION_KINDS = ["STANDARD", "WELLNESS", "KIDS", "SEASONAL"] as const;
export const MENU_COLLECTION_STATUSES = [
  "DRAFT",
  "CONTENT_REVIEW",
  "FOOD_SAFETY_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "PAUSED",
  "ARCHIVED"
] as const;
export const MENU_MEMBERSHIP_SOURCES = ["MANUAL", "RULE", "AI_SUGGESTED"] as const;
export const FOOD_DATA_VERIFICATION_STATUSES = [
  "MISSING",
  "DRAFT",
  "PENDING_REVIEW",
  "VERIFIED",
  "REJECTED",
  "EXPIRED"
] as const;
export const MENU_PUBLICATION_STATUSES = [
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
  "ROLLED_BACK",
  "CANCELLED"
] as const;
export const MENU_COLLECTION_PERMISSIONS = [
  "VIEW",
  "EDIT",
  "REVIEW_CONTENT",
  "REVIEW_FOOD_SAFETY",
  "APPROVE",
  "PUBLISH",
  "ROLLBACK"
] as const;
export const MENU_CHANNELS = ["WEB", "DIGITAL_MENU", "MOBILE"] as const;

export type MenuCollectionKind = (typeof MENU_COLLECTION_KINDS)[number];
export type MenuCollectionStatus = (typeof MENU_COLLECTION_STATUSES)[number];
export type MenuMembershipSource = (typeof MENU_MEMBERSHIP_SOURCES)[number];
export type FoodDataVerificationStatus = (typeof FOOD_DATA_VERIFICATION_STATUSES)[number];
export type MenuPublicationStatus = (typeof MENU_PUBLICATION_STATUSES)[number];
export type MenuCollectionPermission = (typeof MENU_COLLECTION_PERMISSIONS)[number];
export type MenuChannel = (typeof MENU_CHANNELS)[number];
export type MenuActorRole = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN" | "SERVICE";

export interface MenuCollectionCompletenessProduct {
  productId: string;
  hasArabicTitle: boolean;
  hasEnglishTitle: boolean;
  hasPrimaryImage: boolean;
  nutritionStatus?: FoodDataVerificationStatus | null;
  allergenStatus?: FoodDataVerificationStatus | null;
}

export interface MenuCollectionCompletenessInput {
  kind: MenuCollectionKind;
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  activeSectionCount: number;
  products: MenuCollectionCompletenessProduct[];
}

export interface MenuCollectionCompletenessResult {
  score: number;
  blockers: string[];
  readyForContentReview: boolean;
  readyForFoodSafetyReview: boolean;
  readyForApproval: boolean;
}
