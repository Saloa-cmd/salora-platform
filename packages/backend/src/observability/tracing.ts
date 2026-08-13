import { context, propagation, trace, type Span, SpanStatusCode } from "@opentelemetry/api";

const runtimeContextKeys = [
  "component",
  "operation",
  "queueName",
  "jobId",
  "requestId",
  "durationMs",
  "status"
] as const;

const sensitiveAssignment = /\b(password|secret|token|api[_-]?key|database_url|direct_url)\s*[:=]\s*([^\s,;]+)/gi;
const credentialedUrl = /\b([a-z][a-z0-9+.-]*:\/\/)([^@\s/]+)@/gi;
const bearerToken = /\bbearer\s+[^\s,;]+/gi;

export function sanitizeRuntimeMessage(message: string): string {
  return message
    .replace(credentialedUrl, "$1[Filtered]@")
    .replace(bearerToken, "Bearer [Filtered]")
    .replace(sensitiveAssignment, "$1=[Filtered]")
    .slice(0, 500);
}

export function sanitizeRuntimeContext(contextData: Record<string, unknown>): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};

  for (const key of runtimeContextKeys) {
    const value = contextData[key];
    if (typeof value === "string") safe[key] = value.slice(0, 160);
    if (typeof value === "number" && Number.isFinite(value)) safe[key] = value;
    if (typeof value === "boolean") safe[key] = value;
  }

  return safe;
}

export function activeCorrelationId(fallback = "salora-runtime"): string {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  return carrier.traceparent ?? fallback;
}

export async function withSpan<T>(name: string, attributes: Record<string, string | number | boolean>, run: (span: Span) => Promise<T>): Promise<T> {
  const tracer = trace.getTracer("salora-infrastructure");
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await run(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function captureRuntimeError(error: unknown, contextData: Record<string, unknown>): void {
  const rawMessage = error instanceof Error ? error.message : "Unknown infrastructure error";
  console.error("[salora-infrastructure]", {
    message: sanitizeRuntimeMessage(rawMessage),
    correlationId: activeCorrelationId(),
    ...sanitizeRuntimeContext(contextData)
  });
}
