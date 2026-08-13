const sentryConnectSource = "https://*.sentry.io";

export function createContentSecurityPolicy(
  nonce: string,
  environment = process.env.NODE_ENV
): string {
  const developmentScriptSource = environment === "development" ? " 'unsafe-eval'" : "";
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScriptSource}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // React components currently use bounded inline style attributes for
    // runtime theme tokens. Keep that exception separate from style elements.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    `connect-src 'self' ${sentryConnectSource}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ];

  if (environment === "production") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
