/** @file Jason Stys: render the repository-owned SVG as a 512px packaging asset. Locations: docs/SOURCE_MAP.md. */
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(
  new URL("../ui/public/app-icon.svg", import.meta.url),
);
const destination = fileURLToPath(
  new URL("../ui/public/app-icon.png", import.meta.url),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 1,
  });
  await page.goto(
    "data:image/svg+xml," + encodeURIComponent(await readFile(source, "utf8")),
  );
  await page.screenshot({ path: destination, omitBackground: true });
} finally {
  await browser.close();
}
