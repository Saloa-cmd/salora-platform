import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const localBaseUrl = `http://127.0.0.1:${port}`;
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/+$/, "");
const baseURL = externalBaseUrl || localBaseUrl;

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : "line",
  outputDir: "test-results/playwright",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off"
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] }
    }
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `pnpm --filter @salora/web exec next start -H 127.0.0.1 -p ${port}`,
        url: `${localBaseUrl}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe"
      }
});
