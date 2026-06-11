import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    console.info("[salora] instrumentation registered", {
      service: "salora-web",
      analyticsEnabled: process.env.NEXT_PUBLIC_SALORA_ANALYTICS_ENABLED === "true"
    });
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
