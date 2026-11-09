/** @file Jason Stys: real-browser route animation, obstacle editing and independent evidence checks. Locations: docs/SOURCE_MAP.md. */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Read the authenticated page's own origin; never compare undefined error-response fields. */
async function commandSnapshot(page: Page): Promise<unknown[]> {
  return page.evaluate(async () => {
    const response = await fetch("/api/fleet");
    if (!response.ok)
      throw new Error(`Fleet snapshot failed: ${response.status}`);
    const value = (await response.json()).commands;
    if (!Array.isArray(value))
      throw new Error("Fleet commands must be an array");
    return value;
  });
}

test("animation moves along paths, pauses, steps, edits obstacles and exports actual evidence", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Username", { exact: true }).fill("pilot");
  await page
    .getByLabel("Password", { exact: true })
    .fill("synthetic-test-password-42");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const exercise = page.getByRole("region", {
    name: "Animated route rehearsal",
  });
  await expect(exercise).toBeVisible();
  const commandsBefore = await commandSnapshot(page);
  await exercise.scrollIntoViewIfNeeded();
  await page.clock.install();
  const marker = exercise.getByTestId("moving-aircraft-0");
  const initial = await marker.getAttribute("transform");
  await exercise
    .getByRole("button", { name: "Step 1 second", exact: true })
    .click();
  await expect(marker).not.toHaveAttribute("transform", initial!);
  await exercise
    .getByRole("button", { name: "Play rehearsal", exact: true })
    .click();
  const stepped = await marker.getAttribute("transform");
  await page.clock.runFor(1600);
  await expect(marker).not.toHaveAttribute("transform", stepped!);
  await exercise
    .getByRole("button", { name: "Pause rehearsal", exact: true })
    .click();
  const paused = await marker.getAttribute("transform");
  await page.clock.runFor(1600);
  await expect(marker).toHaveAttribute("transform", paused!);
  await exercise.getByLabel("Show projected paths").uncheck();
  await expect(exercise.locator(".projected")).toHaveCount(0);
  await exercise.getByLabel("Show projected paths").check();
  await expect(exercise.locator(".projected")).toHaveCount(1);
  await exercise
    .getByRole("button", { name: "Add obstacle", exact: true })
    .click();
  await expect(exercise.locator(".obstacle")).toHaveCount(2);
  await expect(exercise.getByTestId("exercise-clock")).toContainText(
    "Elapsed 0.0 s",
  );
  await exercise
    .getByRole("button", { name: "Remove obstacle 2", exact: true })
    .click();
  await expect(exercise.locator(".obstacle")).toHaveCount(1);
  await exercise.getByLabel("Rehearsal scenario").selectOption("meeting");
  await expect(exercise.getByTestId("moving-aircraft-1")).toBeVisible();
  for (let i = 0; i < 24; i++)
    await exercise
      .getByRole("button", { name: "Step 1 second", exact: true })
      .click();
  await expect(exercise.locator(".rehearsal-phase")).toContainText(
    "Routes complete",
  );
  await expect(exercise).toContainText("Aircraft separation: 20.0 m");
  const downloaded = page.waitForEvent("download");
  await exercise
    .getByRole("button", { name: "Download rehearsal evidence" })
    .click();
  const download = await downloaded;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const evidence = JSON.parse(Buffer.concat(chunks).toString());
  expect(evidence.simulation_only).toBe(true);
  expect(evidence.frame.aircraft[0].point).toEqual({ east: 0, north: 0 });
  expect(evidence.frame.aircraft[1].point).toEqual({ east: 0, north: 20 });
  expect(JSON.stringify(evidence)).not.toContain("csrf");
  await exercise.getByLabel("Rehearsal scenario").selectOption("blocked");
  await expect(exercise.locator(".rehearsal-phase")).toContainText(
    "Route unavailable",
  );
  await expect(
    exercise.getByRole("button", { name: "Play rehearsal" }),
  ).toBeDisabled();
  expect(await commandSnapshot(page)).toEqual(commandsBefore);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.locator("body").evaluate((body) => body.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("custom scene draft, replay and real file interchange preserve active state on errors", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Username", { exact: true }).fill("pilot");
  await page
    .getByLabel("Password", { exact: true })
    .fill("synthetic-test-password-42");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const exercise = page.getByRole("region", {
    name: "Animated route rehearsal",
  });
  await expect(exercise).toBeVisible();
  const commands = await commandSnapshot(page);
  await exercise
    .getByText("Build a reusable cooperative scene", { exact: true })
    .click();
  await exercise
    .getByLabel("Scene name", { exact: true })
    .fill("Fictional roof inspection");
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
  await expect(
    exercise.getByRole("heading", { name: "Obstacle detour", exact: true }),
  ).toBeVisible();
  await exercise
    .getByRole("button", { name: "Apply scene draft", exact: true })
    .click();
  await expect(
    exercise.getByRole("heading", {
      name: "Fictional roof inspection",
      exact: true,
    }),
  ).toBeVisible();
  const scrub = exercise.getByRole("slider", {
    name: "Replay time (seconds)",
    exact: true,
  });
  await scrub.fill("7");
  const marker = exercise.getByTestId("moving-aircraft-0");
  await expect(marker).toHaveAttribute("transform", "translate(270,140)");
  await scrub.fill("3");
  await expect(marker).toHaveAttribute("transform", "translate(230,140)");
  await scrub.fill("7");
  const downloaded = page.waitForEvent("download");
  await exercise
    .getByRole("button", { name: "Save reusable scene", exact: true })
    .click();
  const stream = await (await downloaded).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const saved = Buffer.concat(chunks);
  const scene = JSON.parse(saved.toString());
  expect(scene.simulation_only).toBe(true);
  expect(scene.routes[0].points).toEqual([
    { east: -50, north: 80 },
    { east: 50, north: 80 },
  ]);
  expect(scene).not.toHaveProperty("frame");
  const upload = exercise.getByLabel("Open reusable scene", { exact: true });
  await upload.setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schema":99}'),
  });
  await expect(
    exercise.getByRole("alert", { name: "Scene interchange error" }),
  ).toContainText("fields");
  await expect(marker).toHaveAttribute("transform", "translate(270,140)");
  await upload.setInputFiles({
    name: "oversized.json",
    mimeType: "application/json",
    buffer: Buffer.alloc(32769, 32),
  });
  await expect(
    exercise.getByRole("alert", { name: "Scene interchange error" }),
  ).toContainText("32 KiB");
  await upload.setInputFiles({
    name: "scene.json",
    mimeType: "application/json",
    buffer: saved,
  });
  await expect(exercise.getByTestId("exercise-clock")).toContainText(
    "Elapsed 0.0 s",
  );
  await scrub.fill("7");
  await expect(marker).toHaveAttribute("transform", "translate(270,140)");
  await exercise
    .getByRole("button", { name: "Add cooperative aircraft", exact: true })
    .click();
  await exercise
    .getByLabel("Aircraft 2 waypoint 1 east", { exact: true })
    .fill("-50");
  await exercise
    .getByLabel("Aircraft 2 waypoint 1 north", { exact: true })
    .fill("80");
  await exercise
    .getByRole("button", { name: "Apply scene draft", exact: true })
    .click();
  await expect(
    exercise.getByRole("alert", { name: "Scene draft error" }),
  ).toContainText("separation");
  await expect(marker).toHaveAttribute("transform", "translate(270,140)");
  await exercise
    .getByRole("button", {
      name: "Copy current scene into editor",
      exact: true,
    })
    .click();
  await exercise.getByLabel("Rehearsal scenario").selectOption("meeting");
  await exercise
    .getByRole("button", {
      name: "Copy current scene into editor",
      exact: true,
    })
    .click();
  await expect(
    exercise.getByLabel("Aircraft 1 ID", { exact: true }),
  ).toHaveValue("Courier A");
  await exercise
    .getByRole("button", { name: "Apply scene draft", exact: true })
    .click();
  await expect(
    exercise.getByRole("heading", {
      name: "Cooperative rendezvous",
      exact: true,
    }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.locator("body").evaluate((body) => body.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const positionTable = exercise.getByRole("region", {
    name: "Aircraft position table",
    exact: true,
  });
  await positionTable.focus();
  await expect(positionTable).toBeFocused();
  if (
    await positionTable.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    )
  ) {
    await positionTable.press("ArrowRight");
    await expect
      .poll(() => positionTable.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  }
  const commandTable = page.getByRole("region", {
    name: "Recent command intents table",
    exact: true,
  });
  await commandTable.focus();
  await expect(commandTable).toBeFocused();
  if (
    await commandTable.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    )
  ) {
    await commandTable.press("ArrowRight");
    await expect
      .poll(() => commandTable.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await commandSnapshot(page)).toEqual(commands);
});
