import { getDashboardAccessToken } from "@/lib/dashboard/client";
import type { MutationState } from "./types";

type ApiEnvelope<T> = {
  data?: T;
  error?: string;
  requestId?: string;
};

async function fetchWithSession(path: string, init: RequestInit): Promise<Response> {
  const request = () => fetch(path, { ...init, credentials: "same-origin" });
  let response = await request();

  if (response.status !== 401) return response;

  const refreshed = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: "{}"
  });

  if (refreshed.ok) response = await request();
  return response;
}

export async function controlTowerPost<T>(path: string, payload: unknown): Promise<MutationState & { data?: T }> {
  return controlTowerSend("POST", path, payload);
}

export async function controlTowerPatch<T>(path: string, payload: unknown): Promise<MutationState & { data?: T }> {
  return controlTowerSend("PATCH", path, payload);
}

export async function controlTowerGet<T>(path: string): Promise<{ status: "success" | "error" | "forbidden"; data?: T; message?: string; requestId?: string }> {
  const requestId = crypto.randomUUID();
  const token = getDashboardAccessToken();
  const headers: HeadersInit = { "x-request-id": requestId };
  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const response = await fetchWithSession(path, { cache: "no-store", headers });
    const body = await response.json().catch(() => ({} as ApiEnvelope<T>));
    const resolvedRequestId = body.requestId ?? response.headers.get("x-request-id") ?? requestId;
    if (response.status === 401 || response.status === 403) return { status: "forbidden", message: body.error ?? "Authorized operator access required.", requestId: resolvedRequestId };
    if (!response.ok || body.error) return { status: "error", message: body.error ?? `Request failed with ${response.status}.`, requestId: resolvedRequestId };
    return { status: "success", data: body.data, requestId: resolvedRequestId };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Request failed.", requestId };
  }
}

async function controlTowerSend<T>(method: "POST" | "PATCH", path: string, payload: unknown): Promise<MutationState & { data?: T }> {
  const requestId = crypto.randomUUID();
  const token = getDashboardAccessToken();
  const headers: HeadersInit = {
    "content-type": "application/json",
    "x-request-id": requestId
  };

  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const response = await fetchWithSession(path, {
      method,
      headers,
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({} as ApiEnvelope<T>));
    const resolvedRequestId = body.requestId ?? response.headers.get("x-request-id") ?? requestId;

    if (response.status === 401 || response.status === 403) {
      return { status: "forbidden", message: body.error ?? "This action requires an authorized operator role.", requestId: resolvedRequestId };
    }

    if (!response.ok || body.error) {
      return { status: "error", message: body.error ?? `Request failed with ${response.status}.`, requestId: resolvedRequestId };
    }

    return { status: "success", message: "Change accepted by SALORA API.", requestId: resolvedRequestId, data: body.data };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Request failed.",
      requestId
    };
  }
}
