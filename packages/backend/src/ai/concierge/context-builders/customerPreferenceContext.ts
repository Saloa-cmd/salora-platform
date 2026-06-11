export function buildCustomerPreferenceContext(preferences: Record<string, unknown> = {}) {
  return {
    taste: preferences.taste ?? "unknown",
    sweetness: preferences.sweetness ?? "unknown",
    caffeine: preferences.caffeine ?? "unknown",
    allergiesKnown: Boolean(preferences.allergies)
  };
}
