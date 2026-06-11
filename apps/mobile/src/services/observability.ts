type ObservabilityEvent = {
  name: string;
  requestId?: string;
  tags?: Record<string, string>;
};

export function captureMobileEvent(event: ObservabilityEvent): void {
  const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

  if (runtimeEnv.EXPO_PUBLIC_ENVIRONMENT !== "production") {
    console.info("[salora-mobile]", event);
  }
}

export function captureMobileError(error: unknown, context: ObservabilityEvent): void {
  const message = error instanceof Error ? error.message : "Unknown mobile error";
  console.error("[salora-mobile]", { ...context, error: message });
}
