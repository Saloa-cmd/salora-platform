import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("public locale and accessibility", () => {
  for (const path of ["/", "/menu", "/privacy"]) {
    test(`${path} has no serious or critical WCAG 2.2 axe violations`, async ({ page }) => {
      test.setTimeout(60_000);
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();
      const blocking = results.violations.filter((violation) =>
        violation.impact === "serious" || violation.impact === "critical"
      );

      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
    });
  }

  test("locale is shared by the menu, home, concierge, and SSR cookie", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/menu", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Switch to English" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("button", { name: "التبديل إلى العربية" }).first()).toBeVisible();
  });

  test("disabled analytics creates no browser request", async ({ page }) => {
    test.setTimeout(60_000);
    const analyticsRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/analytics/")) analyticsRequests.push(request.url());
    });

    await page.goto("/menu", { waitUntil: "networkidle" });
    await page.getByRole("searchbox").fill("coffee");
    await page.waitForTimeout(250);
    expect(analyticsRequests).toEqual([]);
  });
});
