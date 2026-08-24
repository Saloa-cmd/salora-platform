import { Clock3, Sparkles } from "lucide-react";
import type { MenuAuthoritySnapshot, MenuAuthoritySource } from "@salora/types";

type Language = "ar" | "en";

const copy = {
  ar: {
    stale: "قد تتغيّر بعض الاختيارات اليوم",
    staleDetail: "يسعدنا تأكيد المتاح عند الطلب.",
    unavailable: "نرتّب اختيارات اليوم",
    unavailableDetail: "نعمل على تحديث القائمة بعناية، ويسعدنا خدمتك مباشرة خلال ذلك."
  },
  en: {
    stale: "Some selections may vary today",
    staleDetail: "We’ll be happy to confirm today’s availability with your order.",
    unavailable: "Today’s selections are being prepared",
    unavailableDetail: "We’re refreshing the menu with care and are happy to help directly in the meantime."
  }
} as const;

export function ExperienceStatus({
  language,
  source,
  stale,
  databaseHealth,
  compact = false
}: {
  language: Language;
  source: MenuAuthoritySource;
  stale: boolean;
  databaseHealth: MenuAuthoritySnapshot["databaseHealth"];
  compact?: boolean;
}) {
  const unavailable = databaseHealth === "unavailable";
  const live = source === "published-revision" && !stale && !unavailable;

  // Healthy infrastructure is deliberately invisible to customers. The public
  // experience only communicates when a temporary limitation affects choice.
  if (live) return null;

  const t = copy[language];
  const title = unavailable ? t.unavailable : t.stale;
  const detail = unavailable ? t.unavailableDetail : t.staleDetail;
  const Icon = unavailable ? Clock3 : Sparkles;

  return (
    <div
      className="salora-experience-status"
      data-tone={unavailable ? "unavailable" : "stale"}
      data-compact={compact ? "true" : "false"}
      role="status"
      aria-live="polite"
    >
      <span className="salora-experience-status-icon" aria-hidden="true"><Icon /></span>
      <span className="salora-experience-status-copy"><strong>{title}</strong>{compact ? null : <small>{detail}</small>}</span>
    </div>
  );
}
