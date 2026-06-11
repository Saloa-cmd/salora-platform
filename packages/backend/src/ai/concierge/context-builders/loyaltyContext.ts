export function buildLoyaltyContext(loyalty?: { points?: number; tier?: string }) {
  return {
    tier: loyalty?.tier ?? "CLASSIC",
    pointsBand: loyalty?.points ? Math.floor(loyalty.points / 100) * 100 : 0
  };
}
