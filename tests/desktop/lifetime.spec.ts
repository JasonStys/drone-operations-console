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

/** Cleanup opens only owned gates and never overwrites an existing file or turns failure into success. */
async function cleanupGate(path: string): Promise<void> {
  try {
    await writeFile(path, "cleanup gate", { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
}

test("real frozen work finishes before repeated Quit and window Close release ownership", async () => {
  const fixture = resolve(
    process.env.OPS_LIFETIME_FIXTURE ?? ".runtime/lifetime-fixture",
  );
  const run = await mkdtemp(join(tmpdir(), "drone-owned-work-"));
  const readyPath = join(run, "ready.json");
  const exitedPath = join(run, "service-exited.txt");
  const heldPath = join(run, "held-entered.txt");
  const releasePath = join(run, "release-work.txt");
  const receivedPath = join(run, "response-received.txt");
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
    OPS_PROBE_HELD: heldPath,
    OPS_PROBE_RELEASE: releasePath,
    OPS_PROBE_RECEIVED: receivedPath,
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
  let ready: { pid: number; nonce: string } | undefined;
  let released = false;
  let acknowledged = false;
  try {
    const page = await application.firstWindow();
    await page.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    ready = JSON.parse(await readFile(readyPath, "utf8"));
    if (!ready) throw new Error("Missing owned fixture identity");
    expect(Number.isInteger(ready.pid) && ready.pid > 0).toBe(true);
    const health = await page.evaluate(async () =>
      (await fetch("/healthz")).json(),
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
    let responseReceived = false;
    // The real owner injects its launch capability on this actual renderer request;
    // no token or file contents are copied into a network request by the test.
    const held = page
      .evaluate(async () => {
        const response = await fetch("/__owned_qa_hold", {
          signal: AbortSignal.timeout(45000),
        });
        return { status: response.status, body: await response.json() };
      })
      .then((response) => {
        responseReceived = true;
        return response;
      });
    await until(
      async () => {
        try {
          return (
            (await readFile(heldPath, "utf8")).trim() === String(ready?.pid)
          );
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
          throw error;
        }
      },
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
    expect(responseReceived).toBe(false);
    expect(released).toBe(false);
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
    await writeFile(releasePath, "release", { flag: "wx" });
    released = true;
    expect(await held).toEqual({ status: 200, body: { completed: true } });
    await writeFile(receivedPath, "received actual response", { flag: "wx" });
    acknowledged = true;
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
          owned_file_release_and_response_acknowledgment: true,
          launch_token_persisted_or_copied_to_request_by_test: false,
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
    try {
      if (!released) await cleanupGate(releasePath);
    } finally {
      try {
        if (!acknowledged) await cleanupGate(receivedPath);
      } finally {
        if (!ownerExit) await application.close();
      }
    }
  }
});
