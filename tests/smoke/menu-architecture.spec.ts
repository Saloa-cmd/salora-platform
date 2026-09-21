import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

type RuntimeIssue = {
  kind: "console" | "pageerror" | "http";
  message: string;
};

function observeRuntime(page: Page): RuntimeIssue[] {
  const issues: RuntimeIssue[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      issues.push({ kind: "console", message: message.text() });
    }
  });
  page.on("pageerror", (error) => {
    issues.push({ kind: "pageerror", message: error.message });
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      issues.push({ kind: "http", message: `${response.status()} ${response.url()}` });
    }
  });

  return issues;
}

async function expectAuthoritativeMenu(page: Page) {
  const menu = page.locator("main[data-menu-source]");
  await expect(menu).toHaveAttribute("data-menu-source", "published-revision");
  await expect(menu).toHaveAttribute("data-menu-stale", "false");
  await expect(menu).toHaveAttribute("data-menu-total", "139");
  await expect(menu).not.toHaveAttribute("data-menu-revision", "unavailable");
  return menu;
}

async function expectNoBlockingAxeViolations(page: Page, testInfo: TestInfo) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );
  await testInfo.attach("axe-menu.json", {
    body: JSON.stringify({ violations: result.violations }, null, 2),
    contentType: "application/json"
  });
  expect(
    blocking,
    blocking.map((violation) => `${violation.impact}: ${violation.id} — ${violation.help}`).join("\n")
  ).toEqual([]);
}

test.describe("preview public reads — UX-02 menu architecture", () => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL,
    "Authoritative menu journeys run against an explicitly selected same-SHA Preview."
  );

  test("category deep links, keyboard, reload, and history preserve bounded authoritative results", async ({ page }, testInfo) => {
    const issues = observeRuntime(page);
    const response = await page.goto("/menu?category=matcha", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expectAuthoritativeMenu(page);

    const productGrid = page.locator("#menu-product-grid");
    const productCards = productGrid.locator(":scope > .premium-menu-card");
    await expect(page.locator('[data-category-key="matcha"]')).toHaveAttribute("aria-current", "page");
    await expect(productCards).toHaveCount(4);
    expect(await productCards.count()).toBeLessThan(24);
    await expectNoBlockingAxeViolations(page, testInfo);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);

    const hotCoffee = page.locator('[data-category-key="hot-coffee"]');
    await hotCoffee.focus();
    await expect(hotCoffee).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/menu\?category=hot-coffee$/);
    await expect(page.locator('[data-category-key="hot-coffee"]')).toHaveAttribute("aria-current", "page");
    await expect(productCards).toHaveCount(17);

    await page.goBack({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/menu\?category=matcha$/);
    await expect(page.locator('[data-category-key="matcha"]')).toHaveAttribute("aria-current", "page");
    await expect(productCards).toHaveCount(4);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator('[data-category-key="matcha"]')).toHaveAttribute("aria-current", "page");
    await expect(productCards).toHaveCount(4);
    expect(issues).toEqual([]);
  });

  test("authoritative Arabic search supports hits, clearing, zero results, English, and axe", async ({ page }, testInfo) => {
    const issues = observeRuntime(page);
    const response = await page.goto("/menu?category=breakfast", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const menu = await expectAuthoritativeMenu(page);
    await expect(menu).toHaveAttribute("lang", "ar");
    await expect(menu).toHaveAttribute("dir", "rtl");

    const search = page.locator('input[name="q"]');
    await search.fill("ماتشا");
    await search.press("Enter");
    await expect(page).toHaveURL(/q=%D9%85%D8%A7%D8%AA%D8%B4%D8%A7/);
    await expect(page.locator("#menu-product-grid > .premium-menu-card").first()).toBeVisible();
    expect(await page.locator("#menu-product-grid > .premium-menu-card").count()).toBeLessThanOrEqual(24);

    await page.getByRole("button", { name: "مسح التصفية" }).click();
    await expect(page).not.toHaveURL(/(?:\?|&)q=/);
    await expect(page.locator('[data-category-key="breakfast"]')).toHaveAttribute("aria-current", "page");

    await page.locator('input[name="q"]').fill("salora-no-match-ux02-7391");
    await page.locator('form[role="search"] button[type="submit"]').click();
    await expect(page.locator("#menu-product-grid > .premium-menu-card")).toHaveCount(0);
    await expect(page.getByText("لا توجد نتائج مطابقة", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "Switch to English" }).click();
    await expect(menu).toHaveAttribute("lang", "en");
    await expect(menu).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("button", { name: "Browse category" })).toBeVisible();
    await expectNoBlockingAxeViolations(page, testInfo);
    expect(issues).toEqual([]);
  });
});
