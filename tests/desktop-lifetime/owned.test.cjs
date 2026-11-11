/** @file Jason Stys: owned-process ordering and repeated-close fault contracts; locations: docs/SOURCE_MAP.md. */
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { test } = require("node:test");
const { OwnedLifetime } = require("../../desktop/owned-lifetime.cjs");

/** A controlled process/pipe exposes real event ordering; no clock can claim it exited. */
function fixture() {
  const service = new EventEmitter();
  service.exitCode = null;
  service.stdin = new EventEmitter();
  service.stdin.writableEnded = false;
  let ends = 0;
  service.stdin.end = () => {
    ends++;
    service.stdin.writableEnded = true;
  };
  const exits = [];
  let waiting = 0;
  const owner = new OwnedLifetime({
    exit: (code) => exits.push(code),
    waiting: () => waiting++,
  });
  return { service, owner, exits, ends: () => ends, waiting: () => waiting };
}

test("pending startup quit retains ownership until no child is confirmed", () => {
  const f = fixture();
  f.owner.stop();
  assert.deepEqual(f.exits, []);
  assert.equal(f.owner.finished, false);
  f.owner.noChild();
  assert.deepEqual(f.exits, [0]);
  f.owner.stop();
  assert.deepEqual(f.exits, [0]);
});

test("normal close and every repeated quit wait for actual child close, not exitCode", () => {
  const f = fixture();
  f.owner.attach(f.service);
  f.owner.stop();
  f.owner.stop();
  assert.equal(f.ends(), 1);
  f.service.exitCode = 0;
  f.service.emit("exit", 0, null);
  assert.deepEqual(f.exits, []);
  assert.equal(f.owner.finished, false);
  f.owner.stop();
  f.service.emit("close", 0, null);
  assert.deepEqual(f.exits, [0]);
  assert.equal(f.owner.finished, true);
  assert.ok(f.waiting() >= 1);
});

test("quit before attachment sends exactly one EOF when startup creates its child", () => {
  const f = fixture();
  f.owner.stop();
  f.owner.attach(f.service);
  assert.equal(f.ends(), 1);
  assert.deepEqual(f.exits, []);
  f.service.emit("close", 0, null);
  assert.deepEqual(f.exits, [0]);
});

for (const [code, signal] of [
  [0, null],
  [7, null],
  [null, "SIGTERM"],
]) {
  test(`unexpected child close ${code}/${signal} is an error`, () => {
    const f = fixture();
    f.owner.attach(f.service);
    f.service.emit("close", code, signal);
    assert.deepEqual(f.exits, [1]);
  });
}

for (const [code, signal] of [
  [7, null],
  [null, "SIGTERM"],
]) {
  test(`requested stop does not hide failed child ${code}/${signal}`, () => {
    const f = fixture();
    f.owner.attach(f.service);
    f.owner.stop();
    f.service.emit("close", code, signal);
    assert.deepEqual(f.exits, [1]);
  });
}

test("spawn failure still waits for close before reporting error", () => {
  const f = fixture();
  f.owner.attach(f.service);
  f.service.emit("error", new Error("controlled spawn failure"));
  assert.deepEqual(f.exits, []);
  f.service.emit("close", -1, null);
  assert.deepEqual(f.exits, [1]);
});

test("synchronous EOF failure is not retried or converted into early success", () => {
  const f = fixture();
  let attempts = 0;
  f.service.stdin.end = () => {
    attempts++;
    throw new Error("controlled pipe failure");
  };
  f.owner.attach(f.service);
  f.owner.stop();
  f.owner.stop();
  assert.equal(attempts, 1);
  assert.deepEqual(f.exits, []);
  f.service.emit("close", 0, null);
  assert.deepEqual(f.exits, [1]);
});

test("pipe failure during drain remains pending and unsuccessful", () => {
  const f = fixture();
  f.owner.attach(f.service);
  f.owner.stop();
  f.service.stdin.emit("error", { code: "EPIPE" });
  assert.deepEqual(f.exits, []);
  f.service.emit("close", 0, null);
  assert.deepEqual(f.exits, [1]);
});

test("EPIPE after an intentionally stopped successful process does not invent a failure", () => {
  const f = fixture();
  f.owner.attach(f.service);
  f.owner.stop();
  f.service.exitCode = 0;
  f.service.stdin.emit("error", { code: "EPIPE" });
  f.service.emit("close", 0, null);
  assert.deepEqual(f.exits, [0]);
});

test("a pre-ended pipe is not written again", () => {
  const f = fixture();
  f.service.stdin.writableEnded = true;
  f.owner.attach(f.service);
  f.owner.stop();
  assert.equal(f.ends(), 0);
  f.service.emit("close", 0, null);
  assert.deepEqual(f.exits, [0]);
});

test("failed and ordinary no-child startup are distinct", () => {
  const f = fixture();
  f.owner.noChild();
  assert.deepEqual(f.exits, []);
  f.owner.stop();
  assert.deepEqual(f.exits, [0]);
  const bad = fixture();
  bad.owner.noChild(true);
  assert.deepEqual(bad.exits, [1]);
});

test("duplicate attachment/no-child transitions are rejected", () => {
  const f = fixture();
  f.owner.attach(f.service);
  assert.throws(() => f.owner.attach(f.service), /already attached/);
  assert.throws(() => f.owner.noChild(), /not pending/);
  const empty = fixture();
  empty.owner.noChild();
  assert.throws(() => empty.owner.noChild(), /not pending/);
});
