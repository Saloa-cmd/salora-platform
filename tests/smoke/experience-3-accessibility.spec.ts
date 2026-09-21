import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoSeriousOrCritical(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );
  expect(
    blocking,
    blocking.map((violation) => `${violation.impact}: ${violation.id} — ${violation.help}`).join("\n")
  ).toEqual([]);
}

async function switchToEnglish(page: Page) {
  const control = page.getByRole("button", { name: "Switch to English" });
  await expect(control).toBeVisible();
  await control.click();
  await expect(page.locator("main").first()).toHaveAttribute("lang", "en");
  await expect(page.locator("main").first()).toHaveAttribute("dir", "ltr");
}

for (const route of ["/", "/menu", "/login"]) {
  test(`${route} has zero serious or critical axe violations in Arabic and English`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status()).toBeLessThan(500);

    const main = page.locator("main").first();
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute("lang", "ar");
    await expect(main).toHaveAttribute("dir", "rtl");
    await expectNoSeriousOrCritical(page);

    await switchToEnglish(page);
    await expectNoSeriousOrCritical(page);
  });
}
