/** @file Jason Stys: sandboxed native window, owned replay service and private desktop launch capability. Functions/variables: docs/SOURCE_MAP.md. */
const { app, BrowserWindow, dialog, session, Menu } = require("electron");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { join, dirname } = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const { OwnedLifetime } = require("./owned-lifetime.cjs");
const { verifyResources } = require("./resources.cjs");
const { openPrivateLog } = require("./private-directory.cjs");
let nativeWindow;
const lifetime = new OwnedLifetime({
  exit: (code) => app.exit(code),
  waiting: () => {
    if (nativeWindow && !nativeWindow.isDestroyed())
      nativeWindow.setTitle(
        "Finishing current work — keep this window open — Drone Operations Console",
      );
  },
});

/** Reserve a loopback port; the unpredictable readiness nonce rejects a competing listener. */
async function freePort() {
  const socket = net.createServer();
  await new Promise((resolve, reject) =>
    socket.once("error", reject).listen(0, "127.0.0.1", resolve),
  );
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

/** Start only the bundled synthetic replay service, with no shell or renderer privileges. */
async function launch() {
  const port = await freePort();
  if (lifetime.stopping) {
    lifetime.noChild();
    return;
  }
  const origin = `http://127.0.0.1:${port}`;
  const token = randomBytes(32).toString("hex");
  const nonce = randomBytes(32).toString("hex");
  const resources = app.isPackaged
    ? process.resourcesPath
    : join(__dirname, "..", "release");
  const serviceRoot = join(
    resources,
    app.isPackaged ? "service" : "drone-console-service",
  );
  const uiRoot = app.isPackaged
    ? join(resources, "ui")
    : join(__dirname, "..", "dist");
  const metadata = verifyResources(serviceRoot, uiRoot, app.getVersion());
  const folder = app.getPath("userData");
  const log = openPrivateLog(folder, [
    dirname(app.getPath("exe")),
    serviceRoot,
    uiRoot,
  ]);
  const child = spawn(
    join(serviceRoot, "drone-console-service.exe"),
    ["--port", String(port), "--ui", uiRoot, "--data", folder],
    {
      cwd: folder,
      env: { ...process.env, OPS_LAUNCH_TOKEN: token, OPS_LAUNCH_NONCE: nonce },
      windowsHide: true,
      stdio: ["pipe", log, log],
    },
  );
  fs.closeSync(log);
  lifetime.attach(child);
  let failed = false;
  child.once("error", () => {
    failed = true;
  });
  child.once("exit", () => {
    failed = true;
  });
  const isolated = session.fromPartition("drone-console-" + nonce, {
    cache: false,
  });
  isolated.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false),
  );
  isolated.setPermissionCheckHandler(() => false);
  isolated.webRequest.onBeforeRequest((details, callback) => {
    let allowed = false;
    try {
      allowed =
        new URL(details.url).origin === origin ||
        details.url.startsWith("blob:" + origin + "/");
    } catch {}
    callback({ cancel: !allowed });
  });
  isolated.webRequest.onBeforeSendHeaders((details, callback) => {
    if (new URL(details.url).origin === origin)
      details.requestHeaders["X-Ops-Launch-Token"] = token;
    callback({ requestHeaders: details.requestHeaders });
  });
  const window = new BrowserWindow({
    title:
      "Starting private replay service — Drone Operations Console — Jason Stys",
    width: 1440,
    height: 980,
    minWidth: 390,
    minHeight: 640,
    webPreferences: {
      session: isolated,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  nativeWindow = window;
  window.on("close", (event) => {
    if (lifetime.finished) return;
    event.preventDefault();
    lifetime.stop();
  });
  window.on("page-title-updated", (event) => {
    if (lifetime.stopping) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== origin) event.preventDefault();
  });
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Application",
        submenu: [
          { role: "reload" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { role: "quit" },
        ],
      },
    ]),
  );
  let ready = false;
  for (
    let attempt = 0;
    attempt < 160 && !failed && !lifetime.stopping;
    attempt++
  ) {
    try {
      const result = await fetch(origin + "/healthz", {
        signal: AbortSignal.timeout(1000),
      });
      const data = await result.json();
      ready =
        result.ok &&
        data.launcher_nonce === nonce &&
        data.version === metadata.version &&
        data.source_commit === metadata.source_commit;
    } catch {
      /* A bounded startup wait never accepts an unrelated HTTP service. */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (lifetime.stopping) return;
  if (!ready)
    throw new Error(
      "The private replay service did not start. Account data has been preserved.",
    );
  await window.loadURL(origin + "/");
}

app.setPath(
  "userData",
  process.env.OPS_DESKTOP_TEST_DATA ||
    join(app.getPath("appData"), "DroneOperationsConsole"),
);
if (!app.requestSingleInstanceLock()) {
  lifetime.noChild();
  lifetime.stop();
} else {
  app.on("second-instance", () => {
    const window = BrowserWindow.getAllWindows()[0];
    if (window) {
      window.restore();
      window.focus();
    }
  });
  app
    .whenReady()
    .then(launch)
    .catch((error) => {
      if (!lifetime.stopping)
        dialog.showErrorBox("Drone Operations Console", error.message);
      if (lifetime.pending) lifetime.noChild(true);
      else lifetime.stop(true);
    });
}
app.on("window-all-closed", () => lifetime.stop());
app.on("before-quit", (event) => {
  if (lifetime.finished) return;
  event.preventDefault();
  lifetime.stop();
});
