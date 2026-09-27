import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: ".", testMatch: "preview-containment.spec.ts", workers: 1,
  reporter: "line", outputDir: "test-results/containment",
  use: { serviceWorkers: "block", trace: "off" },
  projects: [
    { name: "desktop", use: devices["Desktop Chrome"] },
    { name: "pixel-7", use: devices["Pixel 7"] },
  ],
});
