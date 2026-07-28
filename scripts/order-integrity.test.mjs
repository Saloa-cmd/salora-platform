import assert from "node:assert/strict";
import {
  catalogProductIsAvailable,
  currentCatalogPrice,
  normalizeCatalogModifierOptions
} from "../apps/web/lib/server/commerceIntegrity.ts";

const now = new Date("2026-07-28T08:00:00.000Z"); // 12:00 Tuesday in Muscat

assert.equal(
  currentCatalogPrice(
    2.5,
    [
      { startsAt: new Date("2026-07-01T00:00:00.000Z"), endsAt: null, price: 2.25 },
      { startsAt: new Date("2026-07-20T00:00:00.000Z"), endsAt: null, price: 2.1 },
      { startsAt: new Date("2026-08-01T00:00:00.000Z"), endsAt: null, price: 1.9 }
    ],
    now
  ),
  2.1,
  "The newest active authoritative pricing rule must win."
);

assert.equal(
  catalogProductIsAvailable(
    [{ dayOfWeek: 2, startsAt: "11:00", endsAt: "13:00", isAvailable: true }],
    now
  ),
  true,
  "Muscat-local availability must allow an active Tuesday window."
);

assert.equal(
  catalogProductIsAvailable(
    [{ dayOfWeek: 2, startsAt: "13:01", endsAt: "18:00", isAvailable: true }],
    now
  ),
  false,
  "A product outside its active Muscat-local window must be unavailable."
);

assert.equal(
  catalogProductIsAvailable(
    [
      { dayOfWeek: 2, startsAt: "11:00", endsAt: "13:00", isAvailable: true },
      { dayOfWeek: 2, startsAt: "11:30", endsAt: "12:30", isAvailable: false }
    ],
    now
  ),
  false,
  "An explicit active unavailability rule must override an allow rule."
);

assert.deepEqual(
  normalizeCatalogModifierOptions([{ id: "large", name: "Large", priceDelta: "0.300" }]),
  [{ id: "large", name: "Large", priceDelta: 0.3 }],
  "Modifier prices must be normalized from catalog JSON."
);

console.log("Order integrity tests passed: authoritative pricing, Muscat availability and modifiers verified.");
