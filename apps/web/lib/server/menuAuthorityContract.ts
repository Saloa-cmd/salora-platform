import type { MenuAuthoritySnapshot } from "@salora/types";

export type MenuAuthorityCertificationState = "AUTHORITATIVE" | "BROWSING_FALLBACK";

export class MenuAuthorityContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MenuAuthorityContractError";
  }
}

export function inspectMenuAuthoritySnapshot(
  snapshot: MenuAuthoritySnapshot,
  expectedProductCount?: number
): MenuAuthorityCertificationState {
  if (expectedProductCount !== undefined && snapshot.products.length !== expectedProductCount) {
    throw new MenuAuthorityContractError(
      `Menu Authority product count mismatch: expected ${expectedProductCount}, received ${snapshot.products.length}.`
    );
  }

  if (snapshot.source === "published-revision") {
    if (!snapshot.revision?.id) {
      throw new MenuAuthorityContractError("Published Menu Authority is missing its immutable revision identity.");
    }
    if (snapshot.stale) {
      throw new MenuAuthorityContractError("Published Menu Authority cannot be certified while stale.");
    }

    const mismatchedProduct = snapshot.products.find(
      (product) => product.menuRevisionId !== snapshot.revision?.id
    );
    if (mismatchedProduct) {
      throw new MenuAuthorityContractError(
        `Product ${mismatchedProduct.catalogId ?? mismatchedProduct.id} is not projected from the active revision.`
      );
    }

    return "AUTHORITATIVE";
  }

  if (snapshot.source === "legacy-catalog") {
    if (snapshot.revision !== null) {
      throw new MenuAuthorityContractError("Legacy browsing fallback must not expose a revision identity.");
    }
    if (!snapshot.stale) {
      throw new MenuAuthorityContractError("Legacy browsing fallback must remain explicitly stale.");
    }

    return "BROWSING_FALLBACK";
  }

  throw new MenuAuthorityContractError("Unknown Menu Authority source.");
}

export function assertPublishableMenuAuthority(
  snapshot: MenuAuthoritySnapshot,
  expectedProductCount?: number
): void {
  const state = inspectMenuAuthoritySnapshot(snapshot, expectedProductCount);
  if (state !== "AUTHORITATIVE") {
    throw new MenuAuthorityContractError("Publishing is blocked while Menu Authority is using a browsing fallback.");
  }
}
