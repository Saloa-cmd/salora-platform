export type CatalogAvailabilityRule = {
  dayOfWeek: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isAvailable: boolean;
};

export type CatalogPricingRule = {
  startsAt: Date | null;
  endsAt: Date | null;
  price: { toString(): string } | number | string;
};

export type CatalogModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export function money(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function decimalNumber(value: { toString(): string } | number | string) {
  return Number(value.toString());
}

export function normalizeCatalogModifierOptions(value: unknown): CatalogModifierOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option, index) => {
    if (typeof option === "string") return [{ id: `option-${index}`, name: option, priceDelta: 0 }];
    if (!option || typeof option !== "object") return [];
    const record = option as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : typeof record.label === "string" ? record.label : "";
    if (!name) return [];
    return [{
      id: typeof record.id === "string" ? record.id : `option-${index}`,
      name,
      priceDelta: Number(record.priceDelta ?? record.price ?? 0) || 0
    }];
  });
}

function omanClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Muscat",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dayOfWeek: weekdays[part("weekday")], time: `${part("hour")}:${part("minute")}` };
}

function timeMatches(time: string, startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return true;
  const start = startsAt?.slice(0, 5) ?? "00:00";
  const end = endsAt?.slice(0, 5) ?? "23:59";
  return start <= end ? time >= start && time <= end : time >= start || time <= end;
}

export function catalogProductIsAvailable(rules: CatalogAvailabilityRule[], now: Date) {
  if (rules.length === 0) return true;
  const clock = omanClock(now);
  const active = rules.filter((rule) =>
    (rule.dayOfWeek == null || rule.dayOfWeek === clock.dayOfWeek) &&
    timeMatches(clock.time, rule.startsAt, rule.endsAt)
  );
  return active.length > 0 && active.some((rule) => rule.isAvailable) && active.every((rule) => rule.isAvailable);
}

export function currentCatalogPrice(
  basePrice: { toString(): string } | number | string,
  rules: CatalogPricingRule[],
  now: Date
) {
  const active = rules
    .filter((rule) => (!rule.startsAt || rule.startsAt <= now) && (!rule.endsAt || rule.endsAt >= now))
    .sort((left, right) => (right.startsAt?.getTime() ?? 0) - (left.startsAt?.getTime() ?? 0));
  const currentRule = active[0];
  return money(currentRule ? decimalNumber(currentRule.price) : decimalNumber(basePrice));
}
