import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.UI_BASE_URL ?? "https://www.producthunt.com";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: !process.env.CI,
workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
