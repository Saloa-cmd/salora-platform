// Never place the credential in a browser context or a browser request.
export const AUTH_HEADER = "x-vercel-trusted-oidc-idp-token";
const redirects = new Set([301, 302, 303, 307, 308]);
const fail = code => { throw new Error(code); };

export function previewBoundary(identity, token) {
  if (identity.environment !== "preview" || !identity.deploymentId || !token) fail("PREVIEW_ORIGIN_UNRESOLVED");
  const parse = value => {
    let url;
    try { url = new URL(value); } catch { fail("AUTH_SCOPE_REJECTED"); }
    if (url.username || url.password) fail("AUTH_SCOPE_REJECTED");
    if (url.protocol !== "https:") fail("PROTOCOL_DOWNGRADE_REJECTED");
    return url;
  };
  const approved = parse(identity.deploymentUrl);
  if (approved.port || !/^salora-platform-[a-z0-9-]+\.vercel\.app$/.test(approved.hostname) || approved.pathname !== "/" || approved.search || approved.hash) fail("PREVIEW_ORIGIN_MISMATCH");
  const counts = { authenticatedApproved: 0, authenticatedCrossOrigin: 0, blocked: 0, publicRequests: 0, sameOriginRedirects: 0 };
  const headersFor = (url, headers = {}) => {
    const clean = Object.fromEntries(Object.entries(headers).filter(([key]) => ![AUTH_HEADER, "authorization", "proxy-authorization", "cookie"].includes(key.toLowerCase())));
    if (url.origin === approved.origin) { clean[AUTH_HEADER] = token; counts.authenticatedApproved++; }
    else counts.publicRequests++;
    return clean;
  };
  async function fetch(urlText, options, send, requireApproved = true) {
    let url = parse(urlText);
    if (requireApproved && url.origin !== approved.origin) fail("PREVIEW_ORIGIN_MISMATCH");
    let method = options.method || "GET", data = options.data;
    for (let hop = 0; hop <= 5; hop++) {
      let response;
      try {
        response = await send(url.href, { ...options, method, data, headers: headersFor(url, options.headers), maxRedirects: 0 });
      } catch { fail("AUTHENTICATION_TRANSPORT_FAILED"); } // API errors can contain request headers.
      if (!redirects.has(response.status())) return response;
      const location = response.headers().location;
      let next;
      try {
        if (!location) fail("REDIRECT_TARGET_REJECTED");
        next = parse(new URL(location, url).href);
        if (next.origin !== url.origin) fail("CROSS_ORIGIN_AUTH_BLOCKED");
      } catch (error) {
        counts.blocked++;
        await response.dispose();
        // URL parser exceptions can include an attacker-controlled Location value.
        if (["AUTH_SCOPE_REJECTED", "PROTOCOL_DOWNGRADE_REJECTED", "CROSS_ORIGIN_AUTH_BLOCKED", "REDIRECT_TARGET_REJECTED"].includes(error.message)) throw error;
        fail("REDIRECT_TARGET_REJECTED");
      }
      await response.dispose();
      counts.sameOriginRedirects++;
      if (response.status() === 303 || ([301, 302].includes(response.status()) && method === "POST")) { method = "GET"; data = undefined; }
      url = next;
    }
    fail("REDIRECT_TARGET_REJECTED");
  }
  return { origin: approved.origin, counts, fetch, parse };
}

export async function containBrowser(context, boundary, controlledTransport) {
  const { request: factory } = await import("@playwright/test");
  const send = controlledTransport ?? isolatedTransport(factory);
  const failures = [];
  await context.route("**/*", async route => {
    const request = route.request();
    try {
      const topLevel = request.isNavigationRequest() && request.frame().parentFrame() === null;
      const response = await boundary.fetch(request.url(), {
        method: request.method(), data: request.postDataBuffer(), headers: request.headers(),
      }, send, topLevel);
      try {
        // Fulfill only a final response. Never let the browser inherit redirect authentication.
        const headers = { ...response.headers() };
        delete headers[AUTH_HEADER];
        delete headers["set-cookie"]; // Never turn a protection bypass into browser-wide cookie state.
        await route.fulfill({ status: response.status(), headers, body: await response.body() });
      } finally { await response.dispose(); }
    } catch (error) {
      failures.push(/^[A-Z_]+$/.test(error.message) ? error.message : "AUTH_SCOPE_REJECTED");
      await route.abort("blockedbyclient");
    }
  });
  return () => { if (failures.length) fail(failures[0]); };
}

// An API response must not populate the browser's cookie jar. Each hop has an
// isolated, short-lived transport context; no cookies survive into the next hop.
export function isolatedTransport(factory) {
  return async (url, options) => {
    const client = await factory.newContext();
    try {
      const response = await client.fetch(url, options);
      return {
        status: () => response.status(), headers: () => response.headers(),
        body: () => response.body(), json: () => response.json(), text: () => response.text(),
        ok: () => response.ok(), dispose: () => client.dispose(),
      };
    } catch { await client.dispose(); throw new Error("AUTHENTICATION_TRANSPORT_FAILED"); }
  };
}
