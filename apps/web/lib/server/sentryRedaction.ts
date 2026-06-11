import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const sensitiveKeyPattern = /(authorization|bearer|cookie|password|secret|token|api[_-]?key|dsn|card|payment_method|client_secret|stripe|redis|database_url|direct_url|private|session|refresh)/i;
const redacted = "[Filtered]";

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[Truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > 240 ? `${value.slice(0, 240)}...` : value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      sensitiveKeyPattern.test(key) ? redacted : sanitizeValue(item, depth + 1)
    ])
  );
}

export function sanitizeSentryEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request?.headers) {
    event.request.headers = sanitizeValue(event.request.headers) as Record<string, string>;
  }
  if (event.request?.cookies) {
    event.request.cookies = sanitizeValue(event.request.cookies) as Record<string, string>;
  }
  if (event.request?.data) {
    event.request.data = sanitizeValue(event.request.data);
  }
  if (event.contexts) {
    event.contexts = sanitizeValue(event.contexts) as ErrorEvent["contexts"];
  }
  if (event.extra) {
    event.extra = sanitizeValue(event.extra) as ErrorEvent["extra"];
  }
  if (event.user) {
    event.user = {
      id: event.user.id,
      role: typeof event.user.role === "string" ? event.user.role : undefined
    };
  }
  event.tags = {
    ...event.tags,
    saloraRedaction: "enabled"
  };
  return event;
}
