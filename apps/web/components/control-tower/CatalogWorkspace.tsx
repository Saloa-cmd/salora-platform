"use client";

import { useState } from "react";
import { FileCheck2, ImageIcon, PackageSearch, Settings2 } from "lucide-react";
import { ProductReadinessWorkspace } from "./ProductReadinessWorkspace";
import { P36ActivationReview } from "./P36ActivationReview";
import { ProductActionPanel } from "./NoCodeActionPanel";
import { ProductMediaManager } from "./ProductMediaManager";
import { MenuAuthorityStudio } from "./MenuAuthorityStudio";
import { MediaGovernanceAudit } from "./MediaGovernanceAudit";
import { useControlTowerLocale } from "./ControlTowerLocale";

type CatalogTab = "products" | "media" | "publish" | "settings";

export function CatalogWorkspace() {
  const { isArabic } = useControlTowerLocale();
  const t = (ar: string, en: string) => isArabic ? ar : en;
  const [active, setActive] = useState<CatalogTab>("products");
  const tabs = [
    { id: "products" as const, label: t("الأصناف", "Products"), icon: PackageSearch },
    { id: "media" as const, label: t("الصور", "Media"), icon: ImageIcon },
    { id: "publish" as const, label: t("المراجعة والنشر", "Review & publish"), icon: FileCheck2 },
    { id: "settings" as const, label: t("إعدادات الصنف", "Product settings"), icon: Settings2 }
  ];

  return <div className="grid gap-5"><div className="salora-scroll-strip rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-1.5" role="tablist" aria-label={t("أدوات الكتالوج", "Catalog tools")}>{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} onClick={() => setActive(tab.id)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${active === tab.id ? "bg-[var(--gold)] text-[#17120a]" : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--cream)]"}`}><tab.icon className="h-4 w-4" />{tab.label}</button>)}</div><div role="tabpanel">{active === "products" ? <ProductReadinessWorkspace /> : null}{active === "media" ? <div className="grid gap-5"><ProductMediaManager /><details className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5"><summary className="cursor-pointer text-sm font-semibold">{t("سجل سلامة الصور", "Media integrity history")}</summary><div className="mt-5"><MediaGovernanceAudit /></div></details></div> : null}{active === "publish" ? <div className="grid gap-5"><P36ActivationReview /><MenuAuthorityStudio /></div> : null}{active === "settings" ? <ProductActionPanel /> : null}</div></div>;
}
