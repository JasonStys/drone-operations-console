/** @file Jason Stys: actual-service three-engine browser contracts; settings/lines: docs/SOURCE_MAP.md. */
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 8000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8841",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `${process.env.OPS_PYTHON ?? "python"} tools/serve_test.py`,
    url: "http://127.0.0.1:8841/healthz",
    reuseExistingServer: false,
    timeout: 60000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
