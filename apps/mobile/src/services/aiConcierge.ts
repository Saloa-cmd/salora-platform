import { saloraFetch } from "./apiClient";

export type MobileConciergeResponse = {
  answer: string;
  provider: { provider: string; model: string };
  safety: { blocked: boolean; reasons: string[] };
  evaluation: { score: number; notes: string[] };
  correlationId: string;
};

type ApiEnvelope = {
  requestId?: string;
  data?: MobileConciergeResponse;
  error?: string;
};

export async function askMobileConcierge(message: string, locale = "en") {
  const response = await saloraFetch("/api/ai/concierge", {
    method: "POST",
    body: JSON.stringify({ message, channel: "mobile", locale })
  });
  const payload = await response.json().catch(() => null) as ApiEnvelope | null;
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error ?? "SALORA Concierge is unavailable.");
  }
  return payload.data;
}
