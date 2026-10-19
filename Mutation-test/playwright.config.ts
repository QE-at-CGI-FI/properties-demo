import { defineConfig } from "@playwright/test";

// Same as ../Playwright-test/playwright.config.ts, but headless and quiet,
// for running once per mutant.
export default defineConfig({
  testDir: "Playwright-test",
  reporter: "dot",
  use: { browserName: "webkit", headless: true },
});
