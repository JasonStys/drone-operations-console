/** @file Jason Stys: genuine packaged Windows desktop acceptance, isolated accounts and native renderer. Settings: docs/SOURCE_MAP.md. */
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/desktop",
  workers: 1,
  retries: 0,
  timeout: 90000,
  reporter: "list",
});
