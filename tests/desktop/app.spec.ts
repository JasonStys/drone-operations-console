/** @file Jason Stys: genuine packaged app account setup, animation, renderer sandbox and persistence checks. Locations: docs/SOURCE_MAP.md. */
import { test, expect, _electron } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

test("packaged native app creates a private account, animates a route and retains login across restart", async () => {
  const data = mkdtempSync(join(tmpdir(), "drone-native-"));
  const options = {
    executablePath:
      process.env.OPS_INSTALLED_APP ??
      resolve("release/installers/win-unpacked/Drone Operations Console.exe"),
    env: { ...process.env, OPS_DESKTOP_TEST_DATA: data },
  };
  let app = await _electron.launch(options);
  try {
    let page = await app.firstWindow();
    await page.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    await expect(
      page.getByRole("heading", { name: "Create your local operator account" }),
    ).toBeVisible();
    await page.getByLabel("Username", { exact: true }).fill("native-presenter");
    await page
      .getByLabel("Password", { exact: true })
      .fill("synthetic-test-password-42");
    await page
      .getByRole("button", { name: "Create local account", exact: true })
      .click();
    const exercise = page.getByRole("region", {
      name: "Animated route rehearsal",
    });
    await expect(exercise).toBeVisible();
    await exercise.scrollIntoViewIfNeeded();
    const marker = exercise.getByTestId("moving-aircraft-0");
    const before = await marker.getAttribute("transform");
    await exercise.getByRole("button", { name: "Play rehearsal" }).click();
    await expect(marker).not.toHaveAttribute("transform", before!);
    await exercise.getByRole("button", { name: "Pause rehearsal" }).click();
    await exercise
      .getByText("Build a reusable cooperative scene", { exact: true })
      .click();
    await exercise
      .getByLabel("Scene name", { exact: true })
      .fill("Native fictional inspection");
    for (const [waypoint, east] of [
      [1, "-50"],
      [2, "50"],
    ] as const) {
      await exercise
        .getByLabel(`Aircraft 1 waypoint ${waypoint} east`, { exact: true })
        .fill(east);
      await exercise
        .getByLabel(`Aircraft 1 waypoint ${waypoint} north`, { exact: true })
        .fill("80");
    }
    await exercise
      .getByRole("button", { name: "Apply scene draft", exact: true })
      .click();
    await exercise
      .getByRole("slider", { name: "Replay time (seconds)", exact: true })
      .fill("7");
    await expect(marker).toHaveAttribute("transform", "translate(270,140)");
    expect(
      await page.evaluate(
        () => typeof (window as unknown as { require?: unknown }).require,
      ),
    ).toBe("undefined");
    expect(
      await page.evaluate(
        () => typeof (window as unknown as { process?: unknown }).process,
      ),
    ).toBe("undefined");
    const security = await app.evaluate(({ BrowserWindow }) => {
      const preferences =
        BrowserWindow.getAllWindows()[0]!.webContents.getLastWebPreferences();
      return {
        sandbox: preferences.sandbox,
        isolated: preferences.contextIsolation,
        node: preferences.nodeIntegration,
      };
    });
    expect(security).toEqual({ sandbox: true, isolated: true, node: false });
    await page.screenshot({ path: "test-results/native-rehearsal.png" });
    await app.close();
    app = await _electron.launch(options);
    page = await app.firstWindow();
    await page.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    await expect(
      page.getByRole("heading", { name: "Sign in to your console" }),
    ).toBeVisible();
    await page.getByLabel("Username", { exact: true }).fill("native-presenter");
    await page
      .getByLabel("Password", { exact: true })
      .fill("synthetic-test-password-42");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Flight path rehearsal" }),
    ).toBeVisible();
  } finally {
    await app.close();
  }
});
