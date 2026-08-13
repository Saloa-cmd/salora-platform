import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContentSecurityPolicy } from "../apps/web/lib/server/contentSecurityPolicy.ts";
import {
  sanitizeRuntimeContext,
  sanitizeRuntimeMessage
} from "../packages/backend/src/observability/tracing.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function directive(policy, name) {
  return policy
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name} `)) ?? "";
}

const nonce = "runtimeSecurityNonce123";
const productionPolicy = createContentSecurityPolicy(nonce, "production");
const developmentPolicy = createContentSecurityPolicy(nonce, "development");
const productionScripts = directive(productionPolicy, "script-src");
const productionStyles = directive(productionPolicy, "style-src");

assert.match(productionScripts, new RegExp(`'nonce-${nonce}'`));
assert.match(productionScripts, /'strict-dynamic'/);
assert.doesNotMatch(productionScripts, /'unsafe-inline'/);
assert.doesNotMatch(productionScripts, /'unsafe-eval'/);
assert.match(directive(developmentPolicy, "script-src"), /'unsafe-eval'/);
assert.match(productionStyles, new RegExp(`'nonce-${nonce}'`));
assert.doesNotMatch(productionStyles, /'unsafe-inline'/);
assert.equal(
  directive(productionPolicy, "style-src-attr"),
  "style-src-attr 'unsafe-inline'",
  "Inline style attributes must remain an explicit, isolated compatibility exception."
);
assert.match(productionPolicy, /upgrade-insecure-requests/);
assert.doesNotMatch(developmentPolicy, /upgrade-insecure-requests/);

const proxy = read("apps/web/proxy.ts");
assert.doesNotMatch(proxy, /new Map/);
assert.doesNotMatch(proxy, /requestCounts/);
assert.match(proxy, /requestHeaders\.set\("x-nonce", nonce\)/);
assert.match(proxy, /requestHeaders\.set\("Content-Security-Policy", contentSecurityPolicy\)/);
assert.match(proxy, /response\.headers\.set\("Content-Security-Policy", contentSecurityPolicy\)/);
assert.match(proxy, /next-router-prefetch/);

const rootLayout = read("apps/web/app/layout.tsx");
assert.match(
  rootLayout,
  /export const dynamic = "force-dynamic"/,
  "Nonce-protected App Router pages must render dynamically."
);

const rateLimit = read("apps/web/lib/server/rateLimit.ts");
assert.match(rateLimit, /failureMode: "closed"/);
assert.match(rateLimit, /RateLimitUnavailableError/);
assert.match(rateLimit, /503/);
assert.match(rateLimit, /no-store/);

const sanitizedMessage = sanitizeRuntimeMessage(
  "database_url=postgres://operator:password@db.example.test/prod Bearer abc123 token=secret-value"
);
assert.doesNotMatch(sanitizedMessage, /operator:password|abc123|secret-value/);
assert.match(sanitizedMessage, /\[Filtered\]/);
assert.deepEqual(
  sanitizeRuntimeContext({
    component: "database",
    operation: "connect",
    requestId: "request-123",
    password: "must-not-log",
    authorization: "Bearer must-not-log",
    payload: { customer: "must-not-log" }
  }),
  {
    component: "database",
    operation: "connect",
    requestId: "request-123"
  }
);

console.log("Runtime security controls verified:");
console.log("- production scripts require a per-request nonce");
console.log("- unsafe-inline is absent from script-src and style-src");
console.log("- inline style attributes are isolated as documented debt");
console.log("- process-local rate limiting is absent from proxy");
console.log("- sensitive Redis-backed policies fail closed without leaking causes");
console.log("- infrastructure error logs allowlist context and redact credential patterns");
