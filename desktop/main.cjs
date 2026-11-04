/** @file Jason Stys: sandboxed native window, owned replay service and private desktop launch capability. Functions/variables: docs/SOURCE_MAP.md. */
const { app, BrowserWindow, dialog, session, Menu } = require("electron");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { join } = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
let child;
let closing = false;

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
  const origin = `http://127.0.0.1:${port}`;
  const token = randomBytes(32).toString("hex");
  const nonce = randomBytes(32).toString("hex");
  const resources = app.isPackaged
    ? process.resourcesPath
    : join(__dirname, "..", "release");
  const folder = app.getPath("userData");
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  const log = fs.openSync(join(folder, "service.log"), "a", 0o600);
  child = spawn(
    join(resources, "service", "drone-console-service.exe"),
    [
      "--port",
      String(port),
      "--ui",
      app.isPackaged ? join(resources, "ui") : join(__dirname, "..", "dist"),
      "--data",
      folder,
    ],
    {
      cwd: folder,
      env: { ...process.env, OPS_LAUNCH_TOKEN: token, OPS_LAUNCH_NONCE: nonce },
      windowsHide: true,
      stdio: ["pipe", log, log],
    },
  );
  fs.closeSync(log);
  let failed = false;
  child.once("error", () => {
    failed = true;
  });
  child.once("exit", () => {
    failed = true;
    if (!closing) app.quit();
  });
  let ready = false;
  for (let attempt = 0; attempt < 160 && !failed; attempt++) {
    try {
      const result = await fetch(origin + "/healthz", {
        signal: AbortSignal.timeout(1000),
      });
      const data = await result.json();
      ready = result.ok && data.launcher_nonce === nonce;
    } catch {
      /* A bounded startup wait never accepts an unrelated HTTP service. */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready)
    throw new Error(
      "The private replay service did not start. Account data has been preserved.",
    );
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
    title: "Drone Operations Console — Jason Stys",
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
  await window.loadURL(origin + "/");
}

app.setPath(
  "userData",
  process.env.OPS_DESKTOP_TEST_DATA ||
    join(app.getPath("appData"), "DroneOperationsConsole"),
);
if (!app.requestSingleInstanceLock()) app.quit();
else {
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
      dialog.showErrorBox("Drone Operations Console", error.message);
      app.quit();
    });
}
app.on("window-all-closed", () => app.quit());
app.on("before-quit", (event) => {
  if (closing || !child || child.exitCode !== null) return;
  event.preventDefault();
  closing = true;
  child.stdin.end();
  const timer = setTimeout(() => app.exit(0), 15000);
  child.once("exit", () => {
    clearTimeout(timer);
    app.exit(0);
  });
});
