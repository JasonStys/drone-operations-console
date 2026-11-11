/** @file Jason Stys: pre-write native private-directory and single-link member admission. Lines: docs/SOURCE_MAP.md. */
const fs = require("node:fs");
const path = require("node:path");

const MEMBERS = [
  "service.log",
  "workspace.db",
  "workspace.db-journal",
  "workspace.db-wal",
  "workspace.db-shm",
];

/** Inspect existing lexical ancestors without resolving aliases or silently following Windows junctions. */
function directoryChain(folder) {
  const root = path.parse(folder).root;
  let current = root;
  for (const segment of folder
    .slice(root.length)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, segment);
    let info;
    try {
      info = fs.lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("Private workspace ancestors must be real directories");
  }
}

/** Existing fixed application members must be ordinary singly-linked files, before any write is attempted. */
function memberInfo(filename) {
  let info;
  try {
    info = fs.lstatSync(filename);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1)
    throw new Error(
      "Private workspace members must be single-link ordinary files",
    );
  return info;
}

/** Refuse program roots, aliases and existing linked log/SQLite recovery files before mkdir or append. */
function openPrivateLog(folder, programRoots) {
  if (
    !path.isAbsolute(folder) ||
    (process.platform === "win32" && folder.startsWith("\\\\"))
  )
    throw new Error("Private workspace requires an absolute local path");
  folder = path.resolve(folder);
  for (const program of programRoots) {
    const relative = path.relative(path.resolve(program), folder);
    if (
      relative === "" ||
      (relative !== ".." &&
        !relative.startsWith(".." + path.sep) &&
        !path.isAbsolute(relative))
    )
      throw new Error(
        "Private workspace must remain outside installed program files",
      );
  }
  directoryChain(folder);
  for (const name of MEMBERS) memberInfo(path.join(folder, name));
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  directoryChain(folder);
  const filename = path.join(folder, "service.log");
  const before = memberInfo(filename);
  const descriptor = fs.openSync(
    filename,
    fs.constants.O_WRONLY |
      fs.constants.O_APPEND |
      fs.constants.O_CREAT |
      (fs.constants.O_NOFOLLOW ?? 0),
    0o600,
  );
  try {
    const actual = fs.fstatSync(descriptor);
    if (
      !actual.isFile() ||
      actual.nlink !== 1 ||
      (before && (actual.dev !== before.dev || actual.ino !== before.ino))
    )
      throw new Error(
        "Private log changed or is not a single-link ordinary file",
      );
    return descriptor;
  } catch (error) {
    fs.closeSync(descriptor);
    throw error;
  }
}

module.exports = { openPrivateLog };
