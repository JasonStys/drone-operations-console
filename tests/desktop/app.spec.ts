/** @file Jason Stys: genuine packaged app account setup, animation, renderer sandbox and persistence checks. Locations: docs/SOURCE_MAP.md. */
import { test, expect, _electron } from "@playwright/test";
import {
  mkdtempSync,
  readFileSync,
  cpSync,
  mkdirSync,
  writeFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join, resolve, sep } from "node:path";
import { createRequire } from "node:module";
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
    const identity = JSON.parse(
      readFileSync(
        join(
          dirname(options.executablePath),
          "resources/runtime/0.3.2/service/RELEASE.json",
        ),
        "utf8",
      ),
    );
    expect(identity.source_dirty).toBe(false);
    expect(identity.version).toBe("0.3.2");
    expect(identity.source_commit).toBe(
      execFileSync("git", ["-c", "safe.directory=.", "rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
    );
    const health = await page.evaluate(async () =>
      (await fetch("/healthz")).json(),
    );
    expect(health.version).toBe(identity.version);
    expect(health.source_commit).toBe(identity.source_commit);
    await expect(page.getByText("v0.3.2", { exact: false })).toBeVisible();
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

test("actual packaged app opens its exact version while old upgrade resources remain untouched", async () => {
  const owned = mkdtempSync(join(tmpdir(), "drone-upgrade-layout-"));
  const software = join(owned, "app");
  cpSync(resolve("release/installers/win-unpacked"), software, {
    recursive: true,
    errorOnExist: true,
  });
  for (const member of ["ui", "service"]) {
    cpSync(
      join(software, "resources/runtime/0.3.2", member),
      join(software, "resources", member),
      { recursive: true, errorOnExist: true },
    );
  }
  const leftovers = [
    "resources/ui/assets/index-CQbaKg54.js",
    "resources/service/obsolete.txt",
    "resources/runtime/0.3.1/ui/assets/stale.js",
    "resources/runtime/0.3.1/service/obsolete.txt",
  ];
  const sentinel =
    "globalThis.__OLD_RESOURCE_SENTINEL__ = true; // preserved obsolete public resource";
  for (const name of leftovers) {
    const path = join(software, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, sentinel, { flag: "wx" });
  }
  const { verifyResources } = createRequire(import.meta.url)(
    "../../desktop/resources.cjs",
  );
  expect(() =>
    verifyResources(
      join(software, "resources/service"),
      join(software, "resources/ui"),
      "0.3.2",
    ),
  ).toThrow("Application UI inventory mismatch");
  const application = await _electron.launch({
    executablePath: join(software, "Drone Operations Console.exe"),
    env: {
      ...process.env,
      OPS_DESKTOP_TEST_DATA: join(owned, "private-profile"),
    },
  });
  try {
    const page = await application.firstWindow();
    await page.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    await expect(
      page.getByRole("heading", { name: "Create your local operator account" }),
    ).toBeVisible();
    const health = await page.evaluate(async () =>
      (await fetch("/healthz")).json(),
    );
    expect(health.version).toBe("0.3.2");
    expect(health.source_commit).toBe(
      execFileSync("git", ["-c", "safe.directory=.", "rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
    );
    await page
      .getByLabel("Username", { exact: true })
      .fill("upgrade-presenter");
    await page
      .getByLabel("Password", { exact: true })
      .fill("synthetic-upgrade-password-42");
    await page
      .getByRole("button", { name: "Create local account", exact: true })
      .click();
    const exercise = page.getByRole("region", {
      name: "Animated route rehearsal",
    });
    await expect(exercise).toBeVisible();
    await expect(page.getByText("v0.3.2", { exact: false })).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          typeof (window as unknown as { __OLD_RESOURCE_SENTINEL__?: unknown })
            .__OLD_RESOURCE_SENTINEL__,
      ),
    ).toBe("undefined");
    for (const name of leftovers)
      expect(readFileSync(join(software, name), "utf8")).toBe(sentinel);
    const current = join(software, "resources/runtime/0.3.2");
    expect(
      JSON.parse(readFileSync(join(current, "service/RELEASE.json"), "utf8"))
        .version,
    ).toBe("0.3.2");
    await page.screenshot({
      path: "test-results/native-versioned-upgrade.png",
    });
  } finally {
    await application.close();
    const absolute = realpathSync(owned);
    expect(absolute.startsWith(realpathSync(tmpdir()) + sep)).toBe(true);
    expect(basename(absolute).startsWith("drone-upgrade-layout-")).toBe(true);
    rmSync(absolute, { recursive: true });
  }
});
