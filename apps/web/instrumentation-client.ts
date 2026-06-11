import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true
      })
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        event.request.headers = Object.fromEntries(
          Object.entries(event.request.headers).map(([key, value]) => [
            key,
            /authorization|cookie|token|secret|password|api[_-]?key/i.test(key) ? "[Filtered]" : value
          ])
        );
      }
      return event;
    }
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
