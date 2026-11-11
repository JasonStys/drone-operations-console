/** @file Jason Stys: real owner-log/SQLite alias, program-root and descriptor refusal oracles. Lines: docs/SOURCE_MAP.md. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { join, resolve, sep } = require("node:path");
const { tmpdir } = require("node:os");
const { test } = require("node:test");
const { openPrivateLog } = require("../../desktop/private-directory.cjs");

/** A failed negative oracle must still close an unexpectedly returned real descriptor. */
function refused(operation, pattern) {
  assert.throws(() => {
    const descriptor = operation();
    try {
      assert.fail("Admission unexpectedly returned a writable descriptor");
    } finally {
      fs.closeSync(descriptor);
    }
  }, pattern);
}

/** Create only inert owned paths; cleanup is confined to the resolved exact temporary root. */
function fixture(t) {
  const root = fs.mkdtempSync(join(tmpdir(), "ops-private-admission-"));
  const profile = join(root, "profile");
  const program = join(root, "program");
  fs.mkdirSync(program);
  t.after(() => {
    const target = resolve(root);
    assert.ok(target.startsWith(resolve(tmpdir()) + sep));
    assert.ok(target.split(sep).at(-1).startsWith("ops-private-admission-"));
    fs.rmSync(target, { recursive: true });
  });
  return { root, profile, program };
}

test("ordinary absent/existing workspace writes only its own append log", (t) => {
  const f = fixture(t);
  for (const value of ["first\n", "second\n"]) {
    const descriptor = openPrivateLog(f.profile, [f.program]);
    try {
      fs.writeSync(descriptor, value);
    } finally {
      fs.closeSync(descriptor);
    }
  }
  assert.equal(
    fs.readFileSync(join(f.profile, "service.log"), "utf8"),
    "first\nsecond\n",
  );
  assert.deepEqual(fs.readdirSync(f.profile), ["service.log"]);
});

test("the old append sequence really modifies a hardlinked inert sentinel; corrected admission refuses", (t) => {
  const f = fixture(t);
  const sentinel = join(f.root, "old-inert-sentinel");
  fs.writeFileSync(sentinel, "original", { flag: "wx", mode: 0o600 });
  const oldProfile = join(f.root, "old-profile");
  fs.mkdirSync(oldProfile);
  fs.linkSync(sentinel, join(oldProfile, "service.log"));
  const old = fs.openSync(join(oldProfile, "service.log"), "a", 0o600);
  try {
    fs.writeSync(old, "+old-append");
  } finally {
    fs.closeSync(old);
  }
  assert.equal(fs.readFileSync(sentinel, "utf8"), "original+old-append");
  fs.mkdirSync(f.profile);
  const protectedSentinel = join(f.root, "protected-inert-sentinel");
  fs.writeFileSync(protectedSentinel, "unchanged", { flag: "wx", mode: 0o600 });
  fs.linkSync(protectedSentinel, join(f.profile, "service.log"));
  refused(() => openPrivateLog(f.profile, [f.program]), /single-link ordinary/);
  assert.equal(fs.readFileSync(protectedSentinel, "utf8"), "unchanged");
});

for (const member of [
  "workspace.db",
  "workspace.db-journal",
  "workspace.db-wal",
  "workspace.db-shm",
]) {
  test(`actual linked ${member} refuses all owner writes before opening log`, (t) => {
    const f = fixture(t);
    fs.mkdirSync(f.profile);
    const sentinel = join(f.root, "sentinel");
    fs.writeFileSync(sentinel, "unchanged", { flag: "wx", mode: 0o600 });
    fs.linkSync(sentinel, join(f.profile, member));
    refused(
      () => openPrivateLog(f.profile, [f.program]),
      /single-link ordinary/,
    );
    assert.equal(fs.readFileSync(sentinel, "utf8"), "unchanged");
    assert.deepEqual(fs.readdirSync(f.profile), [member]);
  });
}

test("actual ancestor junction cannot create a profile or log in its empty target", (t) => {
  const f = fixture(t);
  const target = join(f.root, "target");
  const alias = join(f.root, "alias");
  fs.mkdirSync(target);
  fs.symlinkSync(
    target,
    alias,
    process.platform === "win32" ? "junction" : "dir",
  );
  refused(
    () => openPrivateLog(join(alias, "new-profile"), [f.program]),
    /real directories/,
  );
  assert.deepEqual(fs.readdirSync(target), []);
});

test("actual final workspace junction is refused before any target files exist", (t) => {
  const f = fixture(t);
  const target = join(f.root, "target");
  fs.mkdirSync(target);
  fs.symlinkSync(
    target,
    f.profile,
    process.platform === "win32" ? "junction" : "dir",
  );
  refused(() => openPrivateLog(f.profile, [f.program]), /real directories/);
  assert.deepEqual(fs.readdirSync(target), []);
});

test("program root and an absent descendant cannot receive profile files", (t) => {
  const f = fixture(t);
  for (const target of [f.program, join(f.program, "_internal", "profile")]) {
    refused(
      () => openPrivateLog(target, [f.program]),
      /outside installed program/,
    );
  }
  assert.deepEqual(fs.readdirSync(f.program), []);
  refused(
    () => openPrivateLog("relative-profile", [f.program]),
    /absolute local/,
  );
});

test("an existing ordinary member and a similarly prefixed sibling remain valid", (t) => {
  const f = fixture(t);
  const sibling = f.program + "-profile";
  fs.mkdirSync(sibling);
  fs.writeFileSync(join(sibling, "workspace.db"), "inert-not-opened", {
    flag: "wx",
    mode: 0o600,
  });
  const descriptor = openPrivateLog(sibling, [f.program]);
  fs.closeSync(descriptor);
  assert.equal(
    fs.readFileSync(join(sibling, "workspace.db"), "utf8"),
    "inert-not-opened",
  );
});

test("a directory member or file ancestor cannot be treated as a private file/directory", (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.profile);
  fs.mkdirSync(join(f.profile, "service.log"));
  refused(() => openPrivateLog(f.profile, [f.program]), /single-link ordinary/);
  const file = join(f.root, "file-ancestor");
  fs.writeFileSync(file, "inert", { flag: "wx", mode: 0o600 });
  refused(
    () => openPrivateLog(join(file, "profile"), [f.program]),
    /real directories/,
  );
});

test("a link created after open is rejected by the actual descriptor and the descriptor closes", (t) => {
  const f = fixture(t);
  const original = fs.fstatSync;
  let opened;
  fs.fstatSync = (descriptor) => {
    opened = descriptor;
    fs.linkSync(join(f.profile, "service.log"), join(f.root, "late-link"));
    return original(descriptor);
  };
  try {
    refused(() => openPrivateLog(f.profile, [f.program]), /log changed/);
  } finally {
    fs.fstatSync = original;
  }
  assert.throws(() => fs.fstatSync(opened), { code: "EBADF" });
  assert.equal(fs.readFileSync(join(f.root, "late-link"), "utf8"), "");
});

test("unexpected filesystem errors propagate rather than treating admission as absence", (t) => {
  const f = fixture(t);
  const original = fs.lstatSync;
  fs.lstatSync = () => {
    throw Object.assign(new Error("fixture denied"), { code: "EACCES" });
  };
  try {
    refused(() => openPrivateLog(f.profile, [f.program]), /fixture denied/);
  } finally {
    fs.lstatSync = original;
  }
  assert.equal(fs.existsSync(f.profile), false);
});

test("replacement after precheck cannot acquire the original file's identity", (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.profile);
  const log = join(f.profile, "service.log");
  const replacement = join(f.root, "prepared-replacement");
  fs.writeFileSync(log, "original", { flag: "wx", mode: 0o600 });
  fs.writeFileSync(replacement, "replacement", { flag: "wx", mode: 0o600 });
  const original = fs.openSync;
  let opened;
  fs.openSync = (filename, ...args) => {
    assert.equal(filename, log);
    fs.renameSync(log, join(f.root, "previous-log"));
    fs.renameSync(replacement, log);
    opened = original(filename, ...args);
    return opened;
  };
  try {
    refused(() => openPrivateLog(f.profile, [f.program]), /log changed/);
  } finally {
    fs.openSync = original;
  }
  assert.throws(() => fs.fstatSync(opened), { code: "EBADF" });
  assert.equal(fs.readFileSync(log, "utf8"), "replacement");
  assert.equal(
    fs.readFileSync(join(f.root, "previous-log"), "utf8"),
    "original",
  );
});
