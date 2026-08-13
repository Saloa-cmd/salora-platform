import { expect, test } from "@playwright/test";

function cspDirective(policy: string, name: string): string {
  return policy
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name} `)) ?? "";
}

test("liveness is minimal, safe, and non-cacheable", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});

test("login shell renders with matching CSP nonces", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  const response = await page.goto("/login", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Control Tower" })).toBeVisible();
  await expect(page.getByLabel("Email Address")).toBeFocused();

  const policy = response?.headers()["content-security-policy"] ?? "";
  const scriptSource = cspDirective(policy, "script-src");
  const nonce = scriptSource.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  expect(scriptSource).toContain("'strict-dynamic'");
  expect(scriptSource).not.toContain("'unsafe-inline'");

  const scriptNonces = await page.locator("script").evaluateAll((scripts) =>
    scripts.map((script) => script.getAttribute("nonce")).filter(Boolean)
  );
  expect(scriptNonces.length).toBeGreaterThan(0);
  expect(new Set(scriptNonces)).toEqual(new Set([nonce]));

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toEqual([]);
});

test.describe("preview public reads", () => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL,
    "Public DB-backed reads run only against an explicitly selected external Preview."
  );

  for (const path of ["/", "/menu"]) {
    test(`${path} renders without a 5xx`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);
      await expect(page.locator("main").first()).toBeVisible();
    });
  }
});
