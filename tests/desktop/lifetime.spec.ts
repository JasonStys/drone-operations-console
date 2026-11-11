/** @file Jason Stys: actual frozen Uvicorn held-work/repeated-Quit regression with independent process completion. Lines: docs/SOURCE_MAP.md. */
import { test, expect, _electron } from "@playwright/test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { performance } from "node:perf_hooks";

/** Poll observable fixture state with one fixed deadline; failures are never retried as a new run. */
async function until<T>(
  check: () => Promise<T | false>,
  milliseconds: number,
  label: string,
): Promise<T> {
  const end = performance.now() + milliseconds;
  while (performance.now() < end) {
    const result = await check();
    if (result !== false) return result;
    await new Promise((done) => setTimeout(done, 20));
  }
  throw new Error("Deadline exceeded: " + label);
}

test("real frozen work finishes before repeated Quit and window Close release ownership", async () => {
  const fixture = resolve(
    process.env.OPS_LIFETIME_FIXTURE ?? ".runtime/lifetime-fixture",
  );
  const run = await mkdtemp(join(tmpdir(), "drone-owned-work-"));
  const readyPath = join(run, "ready.json");
  const exitedPath = join(run, "service-exited.txt");
  const source = JSON.parse(
    await readFile(join(fixture, "source.json"), "utf8"),
  );
  for (const name of [
    "main.cjs",
    "owned-lifetime.cjs",
    "resources.cjs",
    "private-directory.cjs",
  ]) {
    expect(
      createHash("sha256")
        .update(await readFile(resolve("desktop", name)))
        .digest("hex"),
    ).toBe(source.owner_sha256[name]);
    expect(
      createHash("sha256")
        .update(await readFile(join(fixture, "app/desktop", name)))
        .digest("hex"),
    ).toBe(source.owner_sha256[name]);
  }
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    OPS_DESKTOP_TEST_DATA: join(run, "profile"),
    OPS_PROBE_READY: readyPath,
    OPS_PROBE_EXITED: exitedPath,
  };
  delete environment.ELECTRON_RUN_AS_NODE;
  const application = await _electron.launch({
    executablePath: resolve("node_modules/electron/dist/electron.exe"),
    args: [join(fixture, "app")],
    env: environment,
  });
  const owner = application.process();
  let ownerExit:
    { code: number | null; signal: string | null; at: number } | undefined;
  const ownerClosed = new Promise<void>((done) =>
    owner.once("exit", (code, signal) => {
      ownerExit = { code, signal, at: performance.now() };
      done();
    }),
  );
  let ready:
    { pid: number; control: number; nonce: string; token: string } | undefined;
  let released = false;
  const control = async (path: string) => {
    if (!ready) throw new Error("Fixture not ready");
    const response = await fetch(`http://127.0.0.1:${ready.control}${path}`, {
      headers: { "X-Probe-Nonce": ready.nonce },
      signal: AbortSignal.timeout(2000),
    });
    expect(response.status).toBe(200);
    return response.json();
  };
  try {
    const page = await application.firstWindow();
    await page.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    ready = JSON.parse(await readFile(readyPath, "utf8"));
    if (!ready) throw new Error("Missing owned fixture identity");
    const origin = new URL(page.url()).origin;
    const health = await fetch(origin + "/healthz").then((response) =>
      response.json(),
    );
    expect(health.launcher_nonce).toBe(ready.nonce);
    expect(health.source_commit).toBe(source.source.source_commit);
    expect(health.version).toBe(source.source.version);
    const observed = join(run, "child-exit.json");
    const observer = spawn(
      process.env.OPS_DESKTOP_PYTHON ?? "python",
      [resolve("tools/observe_process.py"), String(ready.pid), observed],
      { stdio: "ignore", windowsHide: true },
    );
    const observerClosed = new Promise<number | null>((done, reject) => {
      observer.once("error", reject);
      observer.once("exit", done);
    });
    await until(
      async () => {
        try {
          return (
            (await readFile(join(run, "child-exit.ready"), "utf8")).trim() ===
            String(ready?.pid)
          );
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
          throw error;
        }
      },
      3000,
      "independent opened process handle",
    );
    const held = fetch(origin + "/__owned_qa_hold", {
      headers: { "X-Ops-Launch-Token": ready.token },
      signal: AbortSignal.timeout(45000),
    }).then(async (response) => ({
      status: response.status,
      body: await response.json(),
    }));
    await until(
      async () => (await control("/state")).held,
      5000,
      "real handler entry",
    );
    const quitAt = performance.now();
    await application.evaluate(({ app }) => {
      setImmediate(() => app.quit());
    });
    // This is the former product's measured15-second forced-exit boundary, not a setup sleep/retry.
    await new Promise((done) => setTimeout(done, 16000));
    expect(ownerExit).toBeUndefined();
    expect(owner.exitCode).toBeNull();
    expect(await control("/state")).toMatchObject({
      held: true,
      released: false,
    });
    const window = await application.evaluate(({ app, BrowserWindow }) => {
      app.quit();
      const current = BrowserWindow.getAllWindows()[0];
      if (!current) throw new Error("Waiting owner lost its window");
      current.close();
      return {
        count: BrowserWindow.getAllWindows().length,
        destroyed: current.isDestroyed(),
        title: current.getTitle(),
      };
    });
    expect(window.count).toBe(1);
    expect(window.destroyed).toBe(false);
    expect(window.title).toContain("Finishing current work");
    expect(ownerExit).toBeUndefined();
    await control("/release");
    released = true;
    expect(await held).toEqual({ status: 200, body: { completed: true } });
    await until(
      async () => ownerExit ?? false,
      10000,
      "actual owner exit after completed work",
    );
    await ownerClosed;
    expect(ownerExit?.code).toBe(0);
    expect(ownerExit?.signal).toBeNull();
    expect(await observerClosed).toBe(0);
    const child = JSON.parse(await readFile(observed, "utf8"));
    expect(child).toMatchObject({
      pid: ready.pid,
      wait_result: 0,
      exit_code: 0,
    });
    expect((await readFile(exitedPath, "utf8")).trim()).toBe(String(ready.pid));
    await writeFile(
      "test-results/native-held-work.json",
      JSON.stringify(
        {
          source,
          passed: true,
          real_held_response_completed: true,
          old15s_boundary_crossed: true,
          repeated_quit_and_close_retained_window: window,
          child,
          owner_exit_code: ownerExit?.code,
          wait_seconds: ((ownerExit?.at ?? 0) - quitAt) / 1000,
          forced_cleanup: false,
          installed_or_real_profile_used: false,
        },
        null,
        2,
      ),
    );
  } finally {
    if (ready && !released) await control("/release");
    if (!ownerExit) await application.close();
  }
});
