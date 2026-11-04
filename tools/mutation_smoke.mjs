/** @file Jason Stys: prove geometry/clock/hold tests reject three deliberate faults, then restore source. Functions/variables: docs/SOURCE_MAP.md. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const file = "ui/src/rehearsal.ts";
const original = fs.readFileSync(file, "utf8");
const mutations = [
  ["obstacle margin removed", "o.radius + CLEARANCE + EPSILON", "-1"],
  [
    "aircraft motion frozen",
    "let remaining = time * speed;",
    "let remaining = 0;",
  ],
  [
    "separation hold bypassed",
    "stop = Math.max(0, t - 0.05);",
    "stop = duration;",
  ],
];
/** Run the genuine unit suite in a fresh process; output is shown only for an unexpected result. */
function suite() {
  return spawnSync(
    process.execPath,
    ["node_modules/vitest/vitest.mjs", "run", "--coverage=false"],
    { encoding: "utf8", timeout: 60000 },
  );
}
const baseline = suite();
if (baseline.status !== 0)
  throw new Error(
    "Baseline suite must pass before mutation testing: " +
      baseline.stdout +
      baseline.stderr,
  );
try {
  for (const [name, before, after] of mutations) {
    if (!original.includes(before))
      throw new Error("Mutation anchor changed: " + name);
    fs.writeFileSync(file, original.replace(before, after));
    const result = suite();
    if (result.status !== 1 || !result.stdout.includes("failed"))
      throw new Error("Mutation was not rejected by assertions: " + name);
    console.log("Detected deliberate fault: " + name);
  }
} finally {
  fs.writeFileSync(file, original);
}
console.log("3/3 faults detected; original source restored.");
