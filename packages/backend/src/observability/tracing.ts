import { context, propagation, trace, type Span, SpanStatusCode } from "@opentelemetry/api";

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
  const message = error instanceof Error ? error.message : "Unknown infrastructure error";
  console.error("[salora-infrastructure]", { message, ...contextData });
}
