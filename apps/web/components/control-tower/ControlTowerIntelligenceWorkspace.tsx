"use client";

import { useState } from "react";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { SaloraIcon, type SaloraIconName } from "@/components/ui/SaloraIcon";
import { useControlTowerLocale } from "./ControlTowerLocale";

type IntelligenceKind = "revenue" | "customers" | "operations" | "ai";

type IntelligenceTab = {
  id: IntelligenceKind;
  icon: SaloraIconName;
  ar: string;
  en: string;
  detailAr: string;
  detailEn: string;
};

const tabs: readonly IntelligenceTab[] = [
  { id: "revenue", icon: "analytics", ar: "الإيرادات", en: "Revenue", detailAr: "الدفع، الاسترداد، القنوات وصافي الإيراد", detailEn: "Payments, refunds, channels and net revenue" },
  { id: "customers", icon: "user", ar: "العملاء", en: "Customers", detailAr: "الصحة، التكرار، القيمة والاحتفاظ", detailEn: "Health, repeat rate, value and retention" },
  { id: "operations", icon: "orders", ar: "التشغيل", en: "Operations", detailAr: "الطلبات، الطوابير، المخزون والتنبيهات", detailEn: "Orders, queues, inventory and alerts" },
  { id: "ai", icon: "ai", ar: "الذكاء الاصطناعي", en: "AI", detailAr: "الاستخدام، الجودة، التكلفة والسلامة", detailEn: "Usage, quality, cost and safety" }
];

const defaultTab: IntelligenceTab = tabs[0]!;

export function ControlTowerIntelligenceWorkspace({ initial = "revenue" }: { initial?: IntelligenceKind }) {
  const { isArabic } = useControlTowerLocale();
  const [active, setActive] = useState<IntelligenceKind>(initial);
  const selected = tabs.find((tab) => tab.id === active) ?? defaultTab;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-2">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label={isArabic ? "مجالات التحليلات" : "Analytics domains"}>
          {tabs.map((tab) => {
            const selectedTab = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selectedTab}
                onClick={() => setActive(tab.id)}
                className={`min-h-20 rounded-xl border p-3 text-start transition ${selectedTab ? "border-[var(--border-gold)] bg-[var(--gold)]/10" : "border-transparent hover:border-[var(--border-subtle)] hover:bg-white/[0.025]"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid size-8 place-items-center rounded-lg ${selectedTab ? "bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "bg-white/[0.04] text-[var(--muted)]"}`}>
                    <SaloraIcon name={tab.icon} className="size-4" />
                  </span>
                  <strong className="text-sm text-[var(--cream)]">{isArabic ? tab.ar : tab.en}</strong>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{isArabic ? tab.detailAr : tab.detailEn}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" aria-label={isArabic ? selected.ar : selected.en}>
        <DashboardView key={active} kind={active} />
      </div>
    </div>
  );
}
