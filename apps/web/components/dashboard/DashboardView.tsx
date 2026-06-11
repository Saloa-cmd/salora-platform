"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCard } from "./AlertCard";
import { DashboardGrid } from "./DashboardGrid";
import { DashboardSection } from "./DashboardSection";
import { KpiCard } from "./KpiCard";
import { RuntimeStatusCard } from "./RuntimeStatusCard";
import { TrendCard } from "./TrendCard";
import { getAiDashboard } from "@/lib/dashboard/aiAdapter";
import { getCustomerDashboard } from "@/lib/dashboard/customerAdapter";
import { getExecutiveDashboard } from "@/lib/dashboard/executiveAdapter";
import { getOperationsDashboard } from "@/lib/dashboard/operationsAdapter";
import { getRevenueDashboard } from "@/lib/dashboard/revenueAdapter";
import { getWhatsappDashboard } from "@/lib/dashboard/whatsappAdapter";
import type {
  AiDashboardData,
  CustomerDashboardData,
  DashboardAlert,
  DashboardMetric,
  DashboardResult,
  ExecutiveDashboardData,
  OperationsDashboardData,
  RevenueDashboardData,
  RuntimeStatus,
  TrendPoint,
  WhatsappDashboardData
} from "@/lib/dashboard/types";

type DashboardKind = "executive" | "revenue" | "operations" | "ai" | "customers" | "whatsapp";

type RenderModel = {
  metrics: DashboardMetric[];
  trendTitle?: string;
  trend?: TrendPoint[];
  secondaryTrendTitle?: string;
  secondaryTrend?: TrendPoint[];
  runtimeTitle: string;
  runtime: RuntimeStatus[];
  alertTitle?: string;
  alerts?: DashboardAlert[];
  description: string;
};

type AnyDashboardData = ExecutiveDashboardData | RevenueDashboardData | OperationsDashboardData | AiDashboardData | CustomerDashboardData | WhatsappDashboardData;

const loaders: Record<DashboardKind, () => Promise<DashboardResult<AnyDashboardData>>> = {
  executive: getExecutiveDashboard,
  revenue: getRevenueDashboard,
  operations: getOperationsDashboard,
  ai: getAiDashboard,
  customers: getCustomerDashboard,
  whatsapp: getWhatsappDashboard
};

function toRenderModel(kind: DashboardKind, data: AnyDashboardData): RenderModel {
  if (kind === "executive") {
    const view = data as ExecutiveDashboardData;
    return {
      metrics: view.metrics,
      trendTitle: "Revenue momentum",
      trend: view.revenueTrend,
      runtimeTitle: "Runtime health",
      runtime: view.runtime,
      alertTitle: "Top alerts",
      alerts: view.alerts,
      description: "Cross-domain executive signal from KPIs, revenue, operations, AI, customer, loyalty, and runtime intelligence."
    };
  }

  if (kind === "revenue") {
    const view = data as RevenueDashboardData;
    return {
      metrics: view.metrics,
      trendTitle: "Revenue trend",
      trend: view.revenueTrend,
      secondaryTrendTitle: "Channel revenue",
      secondaryTrend: view.channelRevenue,
      runtimeTitle: "Payment health",
      runtime: view.paymentHealth,
      description: "Revenue performance, payment success, refunds, channel contribution, and AI attribution readiness."
    };
  }

  if (kind === "operations") {
    const view = data as OperationsDashboardData;
    return {
      metrics: view.metrics,
      runtimeTitle: "Queue health",
      runtime: view.queueHealth,
      alertTitle: "Runtime and inventory alerts",
      alerts: [...view.runtimeAlerts, ...view.inventoryAlerts],
      secondaryTrendTitle: "System health",
      secondaryTrend: view.systemHealth.map((item, index) => ({ label: item.label, value: item.status === "ok" ? 100 : item.status === "warning" ? 65 : index + 10 })),
      description: "Order, queue, inventory, payment failure, runtime, and forecasting readiness signals."
    };
  }

  if (kind === "ai") {
    const view = data as AiDashboardData;
    return {
      metrics: view.metrics,
      trendTitle: "Provider usage",
      trend: view.providerUsage,
      runtimeTitle: "AI model health",
      runtime: view.modelHealth,
      alertTitle: "Recommendation performance",
      alerts: view.recommendationPerformance.map((item) => ({ id: item.label, title: item.label, detail: item.detail, severity: item.status === "critical" ? "critical" : item.status === "warning" ? "warning" : "info" })),
      description: "Provider utilization, cost, evaluation, safety, latency availability, fallback readiness, and recommendation performance."
    };
  }

  if (kind === "customers") {
    const view = data as CustomerDashboardData;
    return {
      metrics: view.metrics,
      trendTitle: "Customer value segments",
      trend: view.valueSegments,
      runtimeTitle: "Retention readiness",
      runtime: view.retentionSignals,
      description: "Customer health, loyalty engagement, retention readiness, churn risk, recommendation acceptance, and customer value segmentation."
    };
  }

  const view = data as WhatsappDashboardData;
  return {
    metrics: view.metrics,
    runtimeTitle: "Channel health",
    runtime: view.channelHealth,
    alertTitle: "Explicit empty states",
    alerts: view.emptyStates,
    secondaryTrendTitle: "Assistance readiness",
    secondaryTrend: view.assistance.map((item, index) => ({ label: item.label, value: item.status === "empty" ? index + 1 : 100 })),
    description: "WhatsApp channel readiness with explicit empty states until exact conversation, latency, and assistant metrics are exposed."
  };
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/[0.055]" />
      ))}
    </div>
  );
}

function BlockingState({ result }: { result: DashboardResult<AnyDashboardData> }) {
  const title = result.status === "unauthorized" ? "Manager or admin access required" : result.status === "empty" ? "No dashboard data available" : "Dashboard data failed to load";

  return (
    <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--gold)]/10 p-6">
      <h2 className="text-lg font-semibold text-[var(--cream)]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{result.message ?? "SALORA returned no usable dashboard payload."}</p>
      {result.requestIds.length ? (
        <p className="mt-4 break-words font-mono text-xs text-[var(--gold-soft)]">Request IDs: {result.requestIds.join(", ")}</p>
      ) : null}
    </div>
  );
}

export function DashboardView({ kind }: { kind: DashboardKind }) {
  const [state, setState] = useState<{ kind: DashboardKind; result: DashboardResult<AnyDashboardData> | null }>({ kind, result: null });
  const startedAt = useRef(0);

  useEffect(() => {
    let active = true;
    startedAt.current = performance.now();
    loaders[kind]().then((nextResult) => {
      if (active) {
        setState({ kind, result: nextResult });
        navigator.sendBeacon?.(
          "/api/telemetry/dashboard",
          new Blob([JSON.stringify({ metric: "dashboard_widget_load_ms", value: performance.now() - startedAt.current })], { type: "application/json" })
        );
      }
    });

    return () => {
      active = false;
    };
  }, [kind]);

  const result = state.kind === kind ? state.result : null;

  if (!result) return <LoadingState />;
  if (!result.data) return <BlockingState result={result} />;

  const model = toRenderModel(kind, result.data);

  return (
    <div className="space-y-8">
      <DashboardSection title="Operating Signal" description={model.description}>
        <DashboardGrid columns="metrics">
          {model.metrics.map((metric) => <KpiCard key={metric.label} metric={metric} />)}
        </DashboardGrid>
      </DashboardSection>

      <DashboardGrid columns="two">
        {model.trendTitle ? <TrendCard title={model.trendTitle} points={model.trend ?? []} /> : null}
        <RuntimeStatusCard title={model.runtimeTitle} statuses={model.runtime} />
        {model.secondaryTrendTitle ? <TrendCard title={model.secondaryTrendTitle} points={model.secondaryTrend ?? []} /> : null}
        {model.alertTitle ? <AlertCard title={model.alertTitle} alerts={model.alerts ?? []} /> : null}
      </DashboardGrid>

      {result.requestIds.length ? (
        <p className="break-words rounded-lg border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs text-[var(--muted)]">
          Correlation: {result.requestIds.join(" | ")}
        </p>
      ) : null}
    </div>
  );
}
