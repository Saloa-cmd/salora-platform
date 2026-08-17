import { expect, test } from "@playwright/test";
test("server preference and nonce bootstrap the dark theme without hydration drift", async ({ context, page }) => {
  await context.addCookies([{ name: "salora_theme", value: "dark", url: "http://127.0.0.1:3100", sameSite: "Lax" }]);
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
});
test.describe("preview appearance controls", () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Theme interaction runs against an explicitly selected Preview.");
  test("public theme cycles and persists", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const control = page.getByRole("button", { name: /appearance|مظهر/ }).first();
    await expect(control).toBeVisible();
    const before = await page.locator("html").getAttribute("data-theme-preference");
    await control.click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-preference", before ?? "");
    await page.reload();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-preference", before ?? "");
  });
});
