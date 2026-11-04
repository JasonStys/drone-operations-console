/** @file Jason Stys: real-browser route animation, obstacle editing and independent evidence checks. Locations: docs/SOURCE_MAP.md. */
import { test, expect } from "@playwright/test";

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
  const commandsBefore = (await (await page.request.get("/api/fleet")).json())
    .commands;
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
  expect(
    (await (await page.request.get("/api/fleet")).json()).commands,
  ).toEqual(commandsBefore);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.locator("body").evaluate((body) => body.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
