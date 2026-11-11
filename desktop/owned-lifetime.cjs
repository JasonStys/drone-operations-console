/** @file Jason Stys: completion-based native service ownership; functions/state: docs/SOURCE_MAP.md. */

/** Keep every quit request pending until the actual owned child closes; never turn a timer into success. */
class OwnedLifetime {
  constructor({ exit, waiting }) {
    this.exit = exit;
    this.waiting = waiting;
    this.pending = true;
    this.service = undefined;
    this.closed = false;
    this.stopping = false;
    this.failed = false;
    this.finished = false;
    this.eofRequested = false;
  }

  /** Attach once, before readiness awaits; Node close confirms the owned process and its pipe have ended. */
  attach(service) {
    if (!this.pending || this.service)
      throw new Error("Owned child already attached");
    this.pending = false;
    this.service = service;
    service.once("error", () => {
      this.failed = true;
      this.stop();
    });
    service.once("close", (code, signal) => {
      this.closed = true;
      this.failed ||= code !== 0 || signal !== null || !this.stopping;
      this.stop();
    });
    service.stdin.once("error", (error) => {
      this.failed ||=
        !this.stopping || error.code !== "EPIPE" || service.exitCode !== 0;
      this.stop();
    });
    if (this.stopping) this.stop();
  }

  /** Complete a cancelled/failed startup only when no child was spawned. */
  noChild(failed = false) {
    if (this.service || !this.pending)
      throw new Error("Owned child state is not pending");
    this.pending = false;
    this.closed = true;
    this.failed ||= failed;
    if (this.stopping || this.failed) this.stop();
  }

  /** Request EOF once and retain the window/single-instance owner through every repeated quit. */
  stop(failed = false) {
    if (this.finished) return;
    this.failed ||= failed;
    this.stopping = true;
    this.waiting();
    if (
      this.service &&
      !this.closed &&
      !this.eofRequested &&
      !this.service.stdin.writableEnded
    ) {
      this.eofRequested = true;
      try {
        this.service.stdin.end();
      } catch {
        this.failed = true;
      }
    }
    if (!this.pending && this.closed) {
      this.finished = true;
      this.exit(this.failed ? 1 : 0);
    }
  }
}

module.exports = { OwnedLifetime };
