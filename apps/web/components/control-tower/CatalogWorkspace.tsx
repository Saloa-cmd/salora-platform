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
  const moveFocus = (current: number, key: string, container: HTMLElement) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
    const next = key === "Home" ? 0 : key === "End" ? tabs.length - 1 : (current + (key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(tabs[next]?.id ?? "products");
    (container.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]')[next])?.focus();
  };

  return <div className="grid gap-5"><div className="salora-scroll-strip rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-1.5" role="tablist" aria-label={t("أدوات الكتالوج", "Catalog tools")}>{tabs.map((tab, index) => <button key={tab.id} id={`catalog-tab-${tab.id}`} type="button" role="tab" aria-controls={`catalog-panel-${tab.id}`} aria-selected={active === tab.id} tabIndex={active === tab.id ? 0 : -1} onClick={() => setActive(tab.id)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) event.preventDefault(); moveFocus(index, event.key, event.currentTarget); }} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${active === tab.id ? "bg-[var(--gold)] text-[#17120a]" : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--cream)]"}`}><tab.icon className="h-4 w-4" />{tab.label}</button>)}</div><div id={`catalog-panel-${active}`} role="tabpanel" aria-labelledby={`catalog-tab-${active}`} tabIndex={0}>{active === "products" ? <ProductReadinessWorkspace /> : null}{active === "media" ? <div className="grid gap-5"><ProductMediaManager /><details className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5"><summary className="cursor-pointer text-sm font-semibold">{t("سجل سلامة الصور", "Media integrity history")}</summary><div className="mt-5"><MediaGovernanceAudit /></div></details></div> : null}{active === "publish" ? <div className="grid gap-5"><P36ActivationReview /><MenuAuthorityStudio /></div> : null}{active === "settings" ? <ProductActionPanel /> : null}</div></div>;
}
