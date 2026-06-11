import { createRequestId } from "@/utils/requestId";

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const apiUrl = runtimeEnv.EXPO_PUBLIC_API_URL || "https://salora.cafe";

export async function saloraFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const requestId = createRequestId();
  const headers = new Headers(init.headers);
  headers.set("x-request-id", requestId);
  headers.set("accept", "application/json");

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return fetch(new URL(path, apiUrl).toString(), {
    ...init,
    headers
  });
}
