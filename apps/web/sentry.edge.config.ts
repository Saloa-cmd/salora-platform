import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "./lib/server/sentryRedaction";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? "staging",
    release: process.env.SENTRY_RELEASE ?? "salora-staging-local",
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend: sanitizeSentryEvent
  });
}
