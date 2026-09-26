import { test, expect } from "@playwright/test";
import { AUTH_HEADER, previewBoundary, containBrowser } from "./preview-auth-boundary.mjs";
const origin = "https://salora-platform-controlled.vercel.app";
const external = "https://controlled.example.invalid";
const canary = "TEST_AUTH_CANARY";
test("browser subresources and redirect destinations cannot inherit the canary", async ({ context, page }) => {
  const upstream: Array<{ url: string; auth: boolean }> = [];
  const browserAuth: string[] = [];
  context.on("request", request => { if (request.headers()[AUTH_HEADER]) browserAuth.push(request.url()); });
  const boundary = previewBoundary({ environment: "preview", deploymentId: "dpl_fixture", deploymentUrl: origin }, canary);
  const verify = await containBrowser(context, boundary, async (url: string, options: any) => {
    expect(options.maxRedirects).toBe(0);
    upstream.push({ url, auth: options.headers[AUTH_HEADER] === canary });
    const redirect = url.endsWith("/redirect");
    const html = url === origin + "/" ? '<html><body><script src="' + external + '/asset.js"></script></body></html>' : "";
    return {
      status: () => redirect ? 302 : 200,
      headers: () => redirect ? { location: external + "/destination" } : { "content-type": url.endsWith(".js") ? "application/javascript" : "text/html" },
      body: async () => Buffer.from(html), dispose: async () => {},
    };
  });
  await page.goto(origin);
  expect(upstream).toContainEqual({ url: origin + "/", auth: true });
  expect(upstream).toContainEqual({ url: external + "/asset.js", auth: false });
  verify();
  await page.evaluate(() => fetch("/redirect").catch(() => null));
  expect(() => verify()).toThrow("CROSS_ORIGIN_AUTH_BLOCKED");
  expect(upstream.some(item => item.url.endsWith("/destination"))).toBe(false);
  expect(upstream.filter(item => new URL(item.url).origin !== origin && item.auth)).toEqual([]);
  expect(browserAuth).toEqual([]);
});
