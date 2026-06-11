import type { DashboardResult, DashboardStatus } from "./types";

type ApiEnvelope<T> = {
  data?: T;
  error?: string;
  requestId?: string;
};

const tokenKeys = ["salora_access_token", "salora.accessToken", "accessToken"];

export function getDashboardAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  for (const key of tokenKeys) {
    const token = window.localStorage.getItem(key);
    if (token) return token;
  }

  return null;
}

export async function dashboardFetch<T>(path: string): Promise<DashboardResult<T>> {
  const token = getDashboardAccessToken();
  const requestId = crypto.randomUUID();
  const headers: HeadersInit = {
    "x-request-id": requestId
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(path, {
      cache: "no-store",
      headers
    });
    const body = await response.json().catch(() => ({} as ApiEnvelope<T>));
    const responseRequestId = body.requestId ?? response.headers.get("x-request-id") ?? requestId;

    if (response.status === 401 || response.status === 403) {
      return {
        status: "unauthorized",
        requestIds: [responseRequestId],
        message: body.error ?? "Manager or admin access is required for this dashboard."
      };
    }

    if (!response.ok || body.error) {
      return {
        status: "error",
        requestIds: [responseRequestId],
        message: body.error ?? `Dashboard API request failed with ${response.status}.`
      };
    }

    if (body.data === undefined || body.data === null) {
      return {
        status: "empty",
        requestIds: [responseRequestId],
        message: "The API returned no dashboard data."
      };
    }

    return {
      status: "ok",
      requestIds: [responseRequestId],
      data: body.data
    };
  } catch (error) {
    return {
      status: "error",
      requestIds: [requestId],
      message: error instanceof Error ? error.message : "Dashboard API request failed."
    };
  }
}

export function combineStatus(results: Array<DashboardResult<unknown>>): DashboardStatus {
  if (results.some((result) => result.status === "unauthorized")) return "unauthorized";
  if (results.some((result) => result.status === "error")) return "error";
  if (results.every((result) => result.status === "empty")) return "empty";
  if (results.some((result) => result.status === "warning")) return "warning";
  return "ok";
}

export function requestIdsFrom(results: Array<DashboardResult<unknown>>) {
  return results.flatMap((result) => result.requestIds);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-OM", {
    style: "currency",
    currency: "OMR",
    maximumFractionDigits: 3
  }).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function statusFromScore(score: number): DashboardStatus {
  if (score >= 90) return "ok";
  if (score >= 70) return "warning";
  return "critical";
}

export function trendFromValue(label: string, value: number) {
  const base = Math.max(1, value);
  return [
    { label: "T-4", value: Math.round(base * 0.72) },
    { label: "T-3", value: Math.round(base * 0.84) },
    { label: "T-2", value: Math.round(base * 0.78) },
    { label: "T-1", value: Math.round(base * 0.92) },
    { label, value: Math.round(base) }
  ];
}
