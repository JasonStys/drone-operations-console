/** @file Jason Stys: actual-service three-engine browser contracts; settings/lines: docs/SOURCE_MAP.md. */
import { defineConfig, devices } from "@playwright/test";
const browsers = [
  { name: "chromium", device: "Desktop Chrome", port: 18841 },
  { name: "firefox", device: "Desktop Firefox", port: 18842 },
  { name: "webkit", device: "Desktop Safari", port: 18843 },
] as const;
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
  webServer: browsers.map((browser) => ({
    command: `${process.env.OPS_PYTHON ?? "python"} tools/serve_test.py`,
    url: `http://127.0.0.1:${browser.port}/healthz`,
    env: { OPS_TEST_PORT: String(browser.port) },
    reuseExistingServer: false,
    timeout: 60000,
  })),
  projects: browsers.map((browser) => ({
    name: browser.name,
    use: {
      ...devices[browser.device],
      baseURL: `http://127.0.0.1:${browser.port}`,
    },
  })),
});
