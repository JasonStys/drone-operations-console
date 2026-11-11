/** @file Jason Stys: real-file package identity, limits, tamper and descriptor regressions; locations: docs/SOURCE_MAP.md. */
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const {
  readBounded,
  patchedPython,
  inventory,
  verifyResources,
} = require("../../desktop/resources.cjs");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Independent authored bytes/expected digests make actual file mismatches observable. */
function fixture(t) {
  const root = fs.mkdtempSync(path.join(tmpdir(), "ops-native-resources-"));
  t.after(() => {
    assert(path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep));
    assert(path.basename(root).startsWith("ops-native-resources-"));
    fs.rmSync(root, { recursive: true });
  });
  const service = path.join(root, "service");
  const ui = path.join(root, "ui");
  fs.mkdirSync(path.join(service, "_internal"), { recursive: true });
  fs.mkdirSync(path.join(ui, "assets"), { recursive: true });
  const bytes = {
    service: "inert service fixture",
    dll: "inert patched DLL fixture",
    html: "<h1>Local fixture</h1>",
    script: "console.log('inert fixture')",
  };
  fs.writeFileSync(
    path.join(service, "drone-console-service.exe"),
    bytes.service,
  );
  fs.writeFileSync(path.join(service, "_internal/python314.dll"), bytes.dll);
  fs.writeFileSync(path.join(ui, "index.html"), bytes.html);
  fs.writeFileSync(path.join(ui, "assets/app.js"), bytes.script);
  const metadata = {
    schema_version: 1,
    name: "drone-operations-console",
    version: "0.3.1",
    source_commit: "b".repeat(40),
    source_dirty: false,
    python_version: "3.14.10",
    service_sha256: sha(bytes.service),
    python_dll_sha256: sha(bytes.dll),
    ui_files: {
      "index.html": sha(bytes.html),
      "assets/app.js": sha(bytes.script),
    },
  };
  const save = () =>
    fs.writeFileSync(
      path.join(service, "RELEASE.json"),
      JSON.stringify(metadata),
    );
  save();
  return {
    root,
    service,
    ui,
    metadata,
    save,
    verify: () => verifyResources(service, ui, "0.3.1"),
  };
}

test("actual complete resource bytes return their immutable source/version", (t) => {
  const f = fixture(t);
  assert.deepEqual(f.verify(), f.metadata);
});

for (const [field, wrong] of [
  ["schema_version", true],
  ["name", "other-product"],
  ["version", "0.3.0"],
  ["source_commit", "unbound"],
  ["source_commit", 1],
  ["source_dirty", true],
  ["python_version", "3.14.6"],
  ["python_version", "3.15.0"],
  ["python_version", null],
  ["ui_files", null],
  ["ui_files", []],
  ["ui_files", "wrong"],
]) {
  test(`one wrong ${field}/${JSON.stringify(wrong)} cannot launch`, (t) => {
    const f = fixture(t);
    f.metadata[field] = wrong;
    f.save();
    assert.throws(f.verify, /identity mismatch/);
  });
}

test("missing/extra top-level fields and nonobjects are not silently accepted", (t) => {
  const f = fixture(t);
  f.metadata.extra = true;
  f.save();
  assert.throws(f.verify, /identity mismatch/);
  for (const raw of ["null", "[]", "42", "{", " ".repeat(32769)]) {
    fs.writeFileSync(path.join(f.service, "RELEASE.json"), raw);
    assert.throws(f.verify);
  }
});

for (const relative of [
  "../outside",
  "/absolute",
  "assets//bad",
  "./dot",
  "assets/../bad",
  "odd name",
])
  test(`unsafe UI inventory path ${relative} is refused`, (t) => {
    const f = fixture(t);
    f.metadata.ui_files[relative] = sha("not read");
    f.save();
    assert.throws(f.verify, /UI inventory/);
  });

test("empty/missing and excessive UI lists are invalid", (t) => {
  const f = fixture(t);
  f.metadata.ui_files = {};
  f.save();
  assert.throws(f.verify, /UI inventory/);
  f.metadata.ui_files = { "index.html": sha("inert") };
  for (let n = 0; n < 128; n++) f.metadata.ui_files[`extra${n}`] = sha("inert");
  f.save();
  assert.throws(f.verify, /UI inventory/);
});

for (const kind of ["service", "dll", "html"])
  test(`actual ${kind} tamper fails its expected hash`, (t) => {
    const f = fixture(t);
    const target = {
      service: path.join(f.service, "drone-console-service.exe"),
      dll: path.join(f.service, "_internal/python314.dll"),
      html: path.join(f.ui, "index.html"),
    }[kind];
    fs.writeFileSync(target, "actual bytes differ from independent original");
    assert.throws(f.verify, /digest mismatch/);
  });

test("invalid digest text and an unlisted actual UI file fail", (t) => {
  const f = fixture(t);
  f.metadata.service_sha256 = "not a hash";
  f.save();
  assert.throws(f.verify, /digest mismatch/);
  fs.writeFileSync(path.join(f.ui, "extra.js"), "unlisted actual file");
  assert.throws(f.verify, /UI inventory/);
});

test("actual root/member junctions or symlinks cannot be traversed", (t) => {
  const f = fixture(t);
  const original = path.join(f.root, "actual-ui");
  fs.renameSync(f.ui, original);
  fs.symlinkSync(original, f.ui, "junction");
  assert.throws(f.verify, /resource directory/);
  const tree = path.join(f.root, "tree");
  fs.mkdirSync(tree);
  fs.symlinkSync(original, path.join(tree, "alias"), "junction");
  assert.throws(() => inventory(tree), /inventory/);
});

test("empty-directory count and depth are bounded independently of file count", (t) => {
  const f = fixture(t);
  const tree = path.join(f.root, "many");
  fs.mkdirSync(tree);
  for (let n = 0; n < 257; n++) fs.mkdirSync(path.join(tree, `dir${n}`));
  assert.throws(() => inventory(tree), /inventory/);
  const deep = path.join(f.root, "deep");
  fs.mkdirSync(deep);
  fs.mkdirSync(path.join(deep, ...Array(9).fill("nested")), {
    recursive: true,
  });
  assert.throws(() => inventory(deep), /directory/);
});

test("an ordinary prototype-shaped filename remains part of the complete inventory", (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.ui, "__proto__"), "not hidden");
  const actual = inventory(f.ui);
  assert.equal(Object.getPrototypeOf(actual), null);
  assert(Object.hasOwn(actual, "__proto__"));
});

test("actual file size, empty inputs and open failures remain errors", (t) => {
  const f = fixture(t);
  const small = path.join(f.root, "small");
  fs.writeFileSync(small, "four");
  assert.equal(readBounded(small, 4).toString(), "four");
  assert.throws(() => readBounded(small, 3), /bounded regular/);
  fs.writeFileSync(small, "");
  assert.throws(() => readBounded(small), /bounded regular/);
  assert.throws(() => readBounded(path.join(f.root, "absent")));
  assert.throws(() => readBounded(f.root));
});

for (const growth of [true, false])
  test(`descriptor ${growth ? "growth" : "truncation"} is detected without pathname reopening`, (t) => {
    const f = fixture(t);
    const filename = path.join(f.root, "changing");
    fs.writeFileSync(filename, "12");
    const writer = fs.openSync(filename, "r+");
    const originalRead = fs.readSync;
    let first = true;
    try {
      fs.readSync = (...args) => {
        if (first) {
          first = false;
          if (growth) fs.writeSync(writer, Buffer.from("3"), 0, 1, 2);
          else fs.ftruncateSync(writer, 1);
        }
        return originalRead(...args);
      };
      assert.throws(() => readBounded(filename), /changed while reading/);
    } finally {
      fs.readSync = originalRead;
      fs.closeSync(writer);
    }
  });

test("interrupted reads close the actual descriptor", (t) => {
  const f = fixture(t);
  const filename = path.join(f.root, "read-error");
  fs.writeFileSync(filename, "inert");
  const originalRead = fs.readSync;
  let descriptor;
  try {
    fs.readSync = (opened) => {
      descriptor = opened;
      throw new Error("controlled read failure");
    };
    assert.throws(() => readBounded(filename), /controlled read failure/);
  } finally {
    fs.readSync = originalRead;
  }
  assert.throws(() => fs.fstatSync(descriptor), /EBADF/);
});

test("final patched-Python floor is explicit and prereleases/other branches are refused", () => {
  for (const [value, expected] of [
    ["3.14.10", true],
    ["3.14.11", true],
    ["3.14.9", false],
    ["3.12.16", false],
    ["3.15.0", false],
    ["3.14.10rc1", false],
    [4, false],
  ])
    assert.equal(patchedPython(value), expected);
});
