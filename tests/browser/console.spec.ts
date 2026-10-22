/** @file Jason Stys: real account, plan, approval, control, replay and accessibility journeys. Locations: docs/SOURCE_MAP.md. */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Authenticate a synthetic test role against the real service, never a mocked fetch response. */
async function login(page: Page, username = "pilot") {
  await page.goto("/");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page
    .getByLabel("Password", { exact: true })
    .fill("synthetic-test-password-42");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Fleet overview" }),
  ).toBeVisible();
}

test("operator reviews an exact target and records a complete rehearsal", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: /Atlas · survey quad/ }).click();
  await page
    .getByLabel("Plan name", { exact: true })
    .fill("Independent browser survey");
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Plan saved");
  for (const label of [
    "Training area and airspace reviewed",
    "Simulated operating area clear",
    "Battery reserve reviewed",
    "Telemetry link reviewed",
    "I understand this controls a simulation only",
  ])
    await page.getByLabel(label, { exact: true }).check();
  await page.getByRole("button", { name: /Approve revision/ }).click();
  await expect(page.getByRole("status")).toContainText("Preflight recorded");
  for (const action of ["upload", "start", "hold", "return"]) {
    await page
      .getByRole("button", {
        name: action[0].toUpperCase() + action.slice(1),
        exact: true,
      })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("atlas / revision");
    await dialog
      .getByRole("button", { name: `Confirm ${action}`, exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Intent recorded");
    await expect(
      page.getByRole("row").filter({ hasText: action }).last(),
    ).toContainText("accepted");
  }
  await page.getByRole("button", { name: "Refresh audit" }).click();
  await expect(page.locator(".audit")).toContainText("command.accepted");
  await page.getByRole("button", { name: "Load retained replay" }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: /Download JSON evidence/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("simulation-evidence.json");
});

test("viewer cannot mutate and stale aircraft remains visibly uncertain", async ({
  page,
}) => {
  await login(page, "reader");
  await expect(
    page.getByRole("button", { name: "Save plan", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Relay · link trainer/ }).click();
  await expect(page.locator(".blockers")).toContainText("stale");
  const response = await page.request.get("/api/evidence");
  expect(response.ok()).toBe(true);
  expect(await response.text()).not.toContain("password_hash");
  await page.getByRole("button", { name: /Sign out reader/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to your console" }),
  ).toBeVisible();
  expect((await page.request.get("/api/fleet")).status()).toBe(401);
});

test("help, responsive layout and accessible operating controls", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "Operator guide", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "From observation to evidence" }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.locator("body").evaluate((body) => body.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await expect(
    page.getByRole("link", { name: "Contact Jason" }),
  ).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/jason-stys-31b30b351/",
  );
});

test("unsaved draft is not approvable and cancelling a modal sends no command", async ({
  page,
}) => {
  await login(page);
  await page.getByLabel("Plan name", { exact: true }).fill("Unsaved changes");
  await expect(
    page.getByRole("button", { name: /Approve revision/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Upload", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Reload saved plan", exact: true })
    .click();
  const before = (await (await page.request.get("/api/fleet")).json()).commands
    .length;
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const after = (await (await page.request.get("/api/fleet")).json()).commands
    .length;
  expect(after).toBe(before);
});
