import { test as base, expect, request as factory } from "@playwright/test";
import { readFileSync } from "node:fs";
import { previewBoundary, containBrowser, isolatedTransport } from "./preview-auth-boundary.mjs";
export { expect };
export type { Page } from "@playwright/test";
const identity = JSON.parse(readFileSync("certification/deployment-identity.json", "utf8"));
const makeBoundary = () => previewBoundary(identity, process.env.VERCEL_TRUSTED_OIDC_TOKEN);
export const test = base.extend({
  context: async ({ context }, use, testInfo) => {
    const boundary = makeBoundary();
    const verify = await containBrowser(context, boundary);
    await use(context);
    verify();
    await testInfo.attach("credential-containment", { body: JSON.stringify(boundary.counts), contentType: "application/json" });
  },
  request: async ({ request }, use) => {
    const boundary = makeBoundary();
    const responses: Array<{ dispose: () => Promise<void> }> = [];
    const send = isolatedTransport(factory);
    // Existing smoke suite uses GET only. Fail closed for any unreviewed API method.
    const scoped = new Proxy(request, {
      get(_target, property) {
        if (property === "get") return async (path: string, options = {}) => {
          const response = await boundary.fetch(new URL(path, boundary.origin).href, { ...options, method: "GET" }, send);
          responses.push(response);
          return response;
        };
        throw new Error("AUTH_SCOPE_REJECTED");
      },
    });
    try { await use(scoped); } finally { for (const response of responses) await response.dispose(); }
  },
});
