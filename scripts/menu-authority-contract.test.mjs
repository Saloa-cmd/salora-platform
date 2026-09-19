import assert from "node:assert/strict";
import {
  MenuAuthorityContractError,
  assertPublishableMenuAuthority,
  inspectMenuAuthoritySnapshot
} from "../apps/web/lib/server/menuAuthorityContract.ts";

const products = Array.from({ length: 139 }, (_, index) => ({
  id: `product-${index + 1}`,
  catalogId: `catalog-${index + 1}`,
  menuRevisionId: "revision-v3",
  name: `Product ${index + 1}`,
  category: "Menu",
  description: "",
  price: 1,
  tags: [],
  visual: `product-${index + 1}`,
  variants: [],
  addons: [],
  modifierGroups: []
}));

const authoritative = {
  collection: { id: "collection", key: "salora-menu", slug: "salora-menu", kind: "STANDARD", nameAr: "منيو سالورا", nameEn: "SALORA Menu" },
  revision: { id: "revision-v3", version: 3, checksum: "a".repeat(64), publishedAt: "2026-09-12T10:11:02.537Z" },
  sections: [],
  products,
  source: "published-revision",
  stale: false,
  runtimeMode: "live",
  databaseHealth: "available",
  generatedAt: "2026-09-12T10:11:02.537Z"
};

assert.equal(inspectMenuAuthoritySnapshot(authoritative, 139), "AUTHORITATIVE");
assert.doesNotThrow(() => assertPublishableMenuAuthority(authoritative, 139));

const fallback = {
  ...authoritative,
  revision: null,
  products: products.map(({ menuRevisionId: _menuRevisionId, ...product }) => product),
  source: "legacy-catalog",
  stale: true,
  runtimeMode: "compatibility"
};

assert.equal(inspectMenuAuthoritySnapshot(fallback, 139), "BROWSING_FALLBACK");
assert.throws(() => assertPublishableMenuAuthority(fallback, 139), MenuAuthorityContractError);
assert.throws(
  () => inspectMenuAuthoritySnapshot({ ...fallback, stale: false }, 139),
  /must remain explicitly stale/
);
assert.throws(
  () => inspectMenuAuthoritySnapshot({ ...authoritative, revision: null }, 139),
  /missing its immutable revision identity/
);
assert.throws(
  () => inspectMenuAuthoritySnapshot({
    ...authoritative,
    products: authoritative.products.map((product, index) => index === 0 ? { ...product, menuRevisionId: "wrong-revision" } : product)
  }, 139),
  /not projected from the active revision/
);
assert.throws(() => inspectMenuAuthoritySnapshot(authoritative, 138), /product count mismatch/);

console.log("SALORA Menu Authority behavioral contract passed:");
console.log("- published revision is authoritative only with a matching revision projection");
console.log("- legacy catalog remains an explicit stale browsing fallback");
console.log("- publishing fails closed while authority cannot be proven");
