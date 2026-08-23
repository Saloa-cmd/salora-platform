import { CircleAlert, CloudOff, Radio } from "lucide-react";
import type { MenuAuthoritySnapshot, MenuAuthoritySource } from "@salora/types";

type Language = "ar" | "en";

const copy = {
  ar: {
    live: "المنيو المباشر متصل",
    liveDetail: "الأسعار والتوفر من النسخة المنشورة الحالية.",
    stale: "وضع توافق مؤقت",
    staleDetail: "نعرض آخر بيانات متاحة مع التحقق عند تأكيد الطلب.",
    unavailable: "المنيو المباشر غير متاح مؤقتًا",
    unavailableDetail: "هوية سالورا متاحة، ولن نعرض أسعارًا أو توفرًا غير موثّق."
  },
  en: {
    live: "Live menu connected",
    liveDetail: "Prices and availability come from the current published revision.",
    stale: "Temporary compatibility mode",
    staleDetail: "The latest available data is shown and revalidated at checkout.",
    unavailable: "Live menu temporarily unavailable",
    unavailableDetail: "SALORA remains available without showing unverified prices or availability."
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
  const t = copy[language];
  const unavailable = databaseHealth === "unavailable";
  const live = source === "published-revision" && !stale && !unavailable;
  const Icon = unavailable ? CloudOff : live ? Radio : CircleAlert;
  const title = unavailable ? t.unavailable : live ? t.live : t.stale;
  const detail = unavailable ? t.unavailableDetail : live ? t.liveDetail : t.staleDetail;

  return (
    <div
      className="salora-experience-status"
      data-tone={unavailable ? "unavailable" : live ? "live" : "stale"}
      data-compact={compact ? "true" : "false"}
      role="status"
      aria-live="polite"
    >
      <span className="salora-experience-status-icon" aria-hidden="true"><Icon /></span>
      <span className="salora-experience-status-copy"><strong>{title}</strong>{compact ? null : <small>{detail}</small>}</span>
    </div>
  );
}
