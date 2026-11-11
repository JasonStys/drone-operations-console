/** @file Jason Stys: exact bounded native source/runtime/UI resource identity; declarations: docs/SOURCE_MAP.md. */
const fs = require("node:fs");
const { createHash } = require("node:crypto");
const { join } = require("node:path");

/** Select only this exact app version; old NSIS resource leftovers are never adopted or deleted. */
function resourceDirectories(resources, developmentRoot, packaged, version) {
  const match =
    typeof version === "string" &&
    /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.exec(version);
  if (!match || match[0] !== version)
    throw new Error("Invalid application resource version");
  if (packaged) {
    const root = join(resources, "runtime", version);
    return { serviceRoot: join(root, "service"), uiRoot: join(root, "ui") };
  }
  return {
    serviceRoot: join(developmentRoot, "release", "drone-console-service"),
    uiRoot: join(developmentRoot, "dist"),
  };
}

/** Read/hash only one actual regular descriptor; pathname growth cannot create an unbounded allocation. */
function readBounded(path, cap = 4096) {
  const descriptor = fs.openSync(
    path,
    fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK ?? 0),
  );
  try {
    const info = fs.fstatSync(descriptor);
    if (!info.isFile() || info.size < 1 || info.size > cap)
      throw new Error("Expected a bounded regular application resource");
    const bytes = Buffer.alloc(Math.min(info.size + 1, cap + 1));
    let size = 0;
    while (size < bytes.length) {
      const count = fs.readSync(
        descriptor,
        bytes,
        size,
        bytes.length - size,
        size,
      );
      if (!count) break;
      size += count;
    }
    if (size !== info.size)
      throw new Error("Application resource changed while reading");
    return bytes.subarray(0, size);
  } finally {
    fs.closeSync(descriptor);
  }
}

/** A reviewed native build must use final security-patched Python3.14.10 or later3.14. */
function patchedPython(value) {
  const match = typeof value === "string" && /^3\.14\.(\d+)$/.exec(value);
  return !!match && Number(match[1]) >= 10;
}

/** Enumerate the complete small production UI, refusing aliases/special files and excessive entries. */
function inventory(
  root,
  prefix = "",
  result = Object.create(null),
  visited = { count: 0 },
) {
  const directory = fs.opendirSync(root);
  try {
    const info = fs.lstatSync(root);
    if (
      !info.isDirectory() ||
      info.isSymbolicLink() ||
      prefix.split("/").length > 8
    )
      throw new Error("Unexpected UI resource directory");
    let entry;
    while ((entry = directory.readSync()) !== null) {
      const relative = prefix + entry.name;
      if (
        ++visited.count > 256 ||
        Object.keys(result).length >= 128 ||
        entry.isSymbolicLink()
      )
        throw new Error("Unexpected UI resource inventory");
      if (entry.isDirectory())
        inventory(join(root, entry.name), relative + "/", result, visited);
      else if (entry.isFile()) result[relative] = true;
      else throw new Error("Unexpected UI resource kind");
    }
  } finally {
    directory.closeSync();
  }
  return result;
}

/** Verify packaged service/DLL bytes, coherent source/version and every UI resource before private data opens. */
function verifyResources(serviceRoot, uiRoot, version) {
  const metadata = JSON.parse(
    readBounded(join(serviceRoot, "RELEASE.json"), 32768),
  );
  const fields = [
    "schema_version",
    "name",
    "version",
    "source_commit",
    "source_dirty",
    "python_version",
    "service_sha256",
    "python_dll_sha256",
    "ui_files",
  ];
  if (
    !metadata ||
    Array.isArray(metadata) ||
    typeof metadata !== "object" ||
    Object.keys(metadata).sort().join() !== fields.sort().join() ||
    metadata.schema_version !== 1 ||
    metadata.name !== "drone-operations-console" ||
    metadata.version !== version ||
    metadata.source_dirty !== false ||
    typeof metadata.source_commit !== "string" ||
    !/^[a-f0-9]{40}$/.test(metadata.source_commit) ||
    !patchedPython(metadata.python_version) ||
    !metadata.ui_files ||
    Array.isArray(metadata.ui_files) ||
    typeof metadata.ui_files !== "object"
  )
    throw new Error("Application source/version identity mismatch");
  const files = metadata.ui_files;
  const names = Object.keys(files).sort();
  if (
    !names.includes("index.html") ||
    names.length > 128 ||
    names.some(
      (name) =>
        !/^[A-Za-z0-9_./-]+$/.test(name) ||
        name.split("/").some((part) => !part || part === "." || part === ".."),
    ) ||
    names.join() !== Object.keys(inventory(uiRoot)).sort().join()
  )
    throw new Error("Application UI inventory mismatch");
  const resources = [
    [
      join(serviceRoot, "drone-console-service.exe"),
      metadata.service_sha256,
      64 * 1024 * 1024,
    ],
    [
      join(serviceRoot, "_internal/python314.dll"),
      metadata.python_dll_sha256,
      64 * 1024 * 1024,
    ],
    ...names.map((name) => [join(uiRoot, name), files[name], 4 * 1024 * 1024]),
  ];
  for (const [path, expected, cap] of resources) {
    if (
      typeof expected !== "string" ||
      !/^[a-f0-9]{64}$/.test(expected) ||
      createHash("sha256").update(readBounded(path, cap)).digest("hex") !==
        expected
    )
      throw new Error("Application resource digest mismatch");
  }
  return metadata;
}

module.exports = {
  resourceDirectories,
  readBounded,
  patchedPython,
  inventory,
  verifyResources,
};
