import { listLoyaltyEntries } from "../../domains/services";

export function getLoyaltyIntelligenceSnapshot() {
  const entries = listLoyaltyEntries();
  const awarded = entries.filter((entry) => entry.points > 0).reduce((sum, entry) => sum + entry.points, 0);
  const reversed = Math.abs(entries.filter((entry) => entry.points < 0).reduce((sum, entry) => sum + entry.points, 0));
  const activeAccounts = new Set(entries.map((entry) => entry.customerId)).size;
  const engagementScore = Math.round(Math.min(100, activeAccounts * 10 + Math.max(0, awarded - reversed)));

  return {
    activeLoyaltyAccounts: activeAccounts,
    pointsAwarded: awarded,
    pointsReversed: reversed,
    netPoints: awarded - reversed,
    rewardEligibilityReadiness: "ready",
    loyaltyEngagementScore: engagementScore
  };
}
