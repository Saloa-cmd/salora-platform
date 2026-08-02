import type {
  MenuActorRole,
  MenuCollectionCompletenessInput,
  MenuCollectionCompletenessResult,
  MenuCollectionPermission,
  MenuCollectionStatus
} from "./types";

const ROLE_PERMISSIONS: Readonly<Record<MenuActorRole, readonly MenuCollectionPermission[]>> = {
  CUSTOMER: [],
  STAFF: ["VIEW"],
  MANAGER: ["VIEW", "EDIT", "REVIEW_CONTENT", "REVIEW_FOOD_SAFETY"],
  ADMIN: ["VIEW", "EDIT", "REVIEW_CONTENT", "REVIEW_FOOD_SAFETY", "APPROVE", "PUBLISH", "ROLLBACK"],
  SERVICE: ["VIEW", "EDIT", "REVIEW_CONTENT", "REVIEW_FOOD_SAFETY", "APPROVE", "PUBLISH", "ROLLBACK"]
};

const STATUS_TRANSITIONS: Readonly<Record<MenuCollectionStatus, readonly MenuCollectionStatus[]>> = {
  DRAFT: ["CONTENT_REVIEW", "ARCHIVED"],
  CONTENT_REVIEW: ["DRAFT", "FOOD_SAFETY_REVIEW", "APPROVED", "ARCHIVED"],
  FOOD_SAFETY_REVIEW: ["CONTENT_REVIEW", "APPROVED", "ARCHIVED"],
  APPROVED: ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"],
  SCHEDULED: ["APPROVED", "PUBLISHED", "PAUSED", "ARCHIVED"],
  PUBLISHED: ["PAUSED", "ARCHIVED"],
  PAUSED: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  ARCHIVED: ["DRAFT"]
};

export function hasMenuCollectionPermission(
  roles: readonly string[],
  permission: MenuCollectionPermission
): boolean {
  return roles.some((role) => {
    const normalized = role.toUpperCase() as MenuActorRole;
    return ROLE_PERMISSIONS[normalized]?.includes(permission) ?? false;
  });
}

export function assertMenuCollectionPermission(
  roles: readonly string[],
  permission: MenuCollectionPermission
): void {
  if (!hasMenuCollectionPermission(roles, permission)) {
    throw new Error(`Menu collection permission '${permission}' is required.`);
  }
}

export function requiredPermissionForTransition(
  targetStatus: MenuCollectionStatus
): MenuCollectionPermission {
  if (targetStatus === "CONTENT_REVIEW" || targetStatus === "DRAFT") return "EDIT";
  if (targetStatus === "FOOD_SAFETY_REVIEW") return "REVIEW_CONTENT";
  if (targetStatus === "APPROVED") return "APPROVE";
  if (targetStatus === "SCHEDULED" || targetStatus === "PUBLISHED" || targetStatus === "PAUSED" || targetStatus === "ARCHIVED") {
    return "PUBLISH";
  }
  return "EDIT";
}

export function assertMenuCollectionTransition(
  currentStatus: MenuCollectionStatus,
  targetStatus: MenuCollectionStatus,
  roles: readonly string[]
): void {
  if (currentStatus === targetStatus) return;
  if (!STATUS_TRANSITIONS[currentStatus].includes(targetStatus)) {
    throw new Error(`Invalid menu collection transition: ${currentStatus} -> ${targetStatus}.`);
  }
  assertMenuCollectionPermission(roles, requiredPermissionForTransition(targetStatus));
}

function ratioScore(passed: number, total: number, weight: number): number {
  if (total <= 0) return 0;
  return Math.round((passed / total) * weight);
}

export function calculateMenuCollectionCompleteness(
  input: MenuCollectionCompletenessInput
): MenuCollectionCompletenessResult {
  const blockers: string[] = [];
  let score = 0;

  const bilingualNames = Boolean(input.nameAr?.trim()) && Boolean(input.nameEn?.trim());
  if (bilingualNames) score += 15;
  else {
    if (!input.nameAr?.trim()) blockers.push("COLLECTION_NAME_AR_MISSING");
    if (!input.nameEn?.trim()) blockers.push("COLLECTION_NAME_EN_MISSING");
  }

  const bilingualDescriptions = Boolean(input.descriptionAr?.trim()) && Boolean(input.descriptionEn?.trim());
  if (bilingualDescriptions) score += 10;
  else {
    if (!input.descriptionAr?.trim()) blockers.push("COLLECTION_DESCRIPTION_AR_MISSING");
    if (!input.descriptionEn?.trim()) blockers.push("COLLECTION_DESCRIPTION_EN_MISSING");
  }

  if (input.activeSectionCount > 0) score += 15;
  else blockers.push("NO_ACTIVE_SECTIONS");

  if (input.products.length > 0) score += 15;
  else blockers.push("NO_COLLECTION_PRODUCTS");

  const translatedProducts = input.products.filter((product) => product.hasArabicTitle && product.hasEnglishTitle).length;
  score += ratioScore(translatedProducts, input.products.length, 10);
  if (translatedProducts !== input.products.length) blockers.push("PRODUCT_TRANSLATION_INCOMPLETE");

  const productsWithImages = input.products.filter((product) => product.hasPrimaryImage).length;
  score += ratioScore(productsWithImages, input.products.length, 15);
  if (productsWithImages !== input.products.length) blockers.push("PRODUCT_PRIMARY_IMAGE_INCOMPLETE");

  const foodReviewRequired = input.kind === "WELLNESS" || input.kind === "KIDS";
  if (!foodReviewRequired) {
    score += 20;
  } else {
    const verifiedNutrition = input.products.filter((product) => product.nutritionStatus === "VERIFIED").length;
    const verifiedAllergens = input.products.filter((product) => product.allergenStatus === "VERIFIED").length;
    score += ratioScore(verifiedNutrition, input.products.length, 10);
    score += ratioScore(verifiedAllergens, input.products.length, 10);

    if (verifiedNutrition !== input.products.length) blockers.push("NUTRITION_REVIEW_INCOMPLETE");
    if (verifiedAllergens !== input.products.length) blockers.push("ALLERGEN_REVIEW_INCOMPLETE");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const normalizedScore = Math.max(0, Math.min(100, score));
  const contentBlockers = uniqueBlockers.filter((blocker) =>
    [
      "COLLECTION_NAME_AR_MISSING",
      "COLLECTION_NAME_EN_MISSING",
      "COLLECTION_DESCRIPTION_AR_MISSING",
      "COLLECTION_DESCRIPTION_EN_MISSING",
      "NO_ACTIVE_SECTIONS",
      "NO_COLLECTION_PRODUCTS",
      "PRODUCT_TRANSLATION_INCOMPLETE",
      "PRODUCT_PRIMARY_IMAGE_INCOMPLETE"
    ].includes(blocker)
  );

  return {
    score: normalizedScore,
    blockers: uniqueBlockers,
    readyForContentReview: contentBlockers.length === 0,
    readyForFoodSafetyReview: foodReviewRequired && contentBlockers.length === 0,
    readyForApproval: normalizedScore === 100 && uniqueBlockers.length === 0
  };
}
