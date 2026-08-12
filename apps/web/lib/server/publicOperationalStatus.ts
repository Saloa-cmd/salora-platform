export const PUBLIC_OPERATIONAL_STATUS_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
} as const;

export type PublicOperationalStatusValue = "ok" | "ready" | "not-ready";

type OperationalStatusEvidence = {
  status: PublicOperationalStatusValue;
  [key: string]: unknown;
};

/**
 * Constructs the public operational payload from an explicit allowlist.
 * Internal evidence is intentionally accepted but never copied wholesale.
 */
export function createPublicOperationalStatus(evidence: OperationalStatusEvidence) {
  return {
    status: evidence.status
  };
}
