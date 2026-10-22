/** @file Jason Stys: accessible authenticated fleet UI, exact-target review and offline grid/replay. Locations: docs/SOURCE_MAP.md. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { freshness, project, routeLength, type Point } from "./geometry";
import "./style.css";

type Sample = Point & {
  sequence: number;
  received_at: number;
  battery_pct: number;
  speed_m_s: number;
  mode: string;
  armed: boolean;
  healthy: boolean;
};
type Plan = { name: string; speed_m_s: number; points: Point[] };
type Aircraft = {
  id: string;
  name: string;
  plan: Plan;
  revision: number;
  approved_by: string | null;
  approved_at: number | null;
  sample: Sample | null;
  blockers: string[];
};
type Command = {
  id: string;
  aircraft: string;
  action: string;
  status: string;
  message: string;
};
type Fleet = {
  read_only: boolean;
  mode: string;
  aircraft: Aircraft[];
  commands: Command[];
  generated_at: number;
};
type User = {
  name: string;
  role: "viewer" | "operator" | "admin";
  csrf: string;
};
type Audit = {
  id: number;
  at: number;
  actor: string;
  event: string;
  aircraft: string;
  detail: string;
};
const checks = {
  airspace: "Training area and airspace reviewed",
  area_clear: "Simulated operating area clear",
  battery: "Battery reserve reviewed",
  link: "Telemetry link reviewed",
  simulation: "I understand this controls a simulation only",
};

/** Same-origin JSON only; no token in localStorage and no automatic command retries. */
async function request<T>(
  url: string,
  method = "GET",
  body?: unknown,
  csrf?: string,
  key?: string,
): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      typeof value.detail === "string"
        ? value.detail
        : "Invalid request; check the bounded field limits",
    );
  return value as T;
}

/** Render the entire same-workspace UI; server-side roles and safety checks remain authoritative. */
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [selected, setSelected] = useState("atlas");
  const [draft, setDraft] = useState<Plan | null>(null);
  const [draftRevision, setDraftRevision] = useState(1);
  const [attest, setAttest] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [intent, setIntent] = useState<{
    aircraft: string;
    revision: number;
    action: string;
  } | null>(null);
  const [history, setHistory] = useState<Sample[]>([]);
  const [cursor, setCursor] = useState(0);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [help, setHelp] = useState(false);
  const [now, setNow] = useState(Date.now() / 1000);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const aircraft = fleet?.aircraft.find((item) => item.id === selected);
  const writable =
    (user?.role === "operator" || user?.role === "admin") && !fleet?.read_only;
  const draftMatches = Boolean(
    aircraft &&
    draft &&
    draftRevision === aircraft.revision &&
    JSON.stringify(draft) === JSON.stringify(aircraft.plan),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (intent && dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [intent]);

  async function refresh() {
    const result = await request<Fleet>("/api/fleet");
    setFleet(result);
    return result;
  }

  useEffect(() => {
    request<User>("/api/me")
      .then(setUser)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    let running = false;
    async function poll() {
      if (running) return;
      running = true;
      try {
        const value = await request<Fleet>("/api/fleet");
        if (active) setFleet(value);
      } catch {
        if (active)
          setNotice(
            "Connection unavailable. Values may be stale; commands are never retried automatically.",
          );
      } finally {
        running = false;
      }
    }
    void poll();
    const timer = setInterval(() => void poll(), 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user]);

  useEffect(() => {
    if (
      !fleet?.aircraft.some((item) => item.id === selected) &&
      fleet?.aircraft[0]
    )
      setSelected(fleet.aircraft[0].id);
    // Drafts load only when selecting an aircraft, not on every telemetry poll.
    if (aircraft && !draft) {
      setDraft(structuredClone(aircraft.plan));
      setDraftRevision(aircraft.revision);
    }
  }, [fleet, selected, aircraft, draft]);

  async function perform(
    operation: () => Promise<unknown>,
    success: string,
    reload = true,
  ) {
    setBusy(true);
    setNotice("");
    try {
      await operation();
      if (reload) await refresh();
      setNotice(success);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Request failed; inspect current state before retrying",
      );
    } finally {
      setBusy(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      setUser(
        await request<User>("/api/login", "POST", {
          username: data.get("username"),
          password: data.get("password"),
        }),
      );
      setNotice("");
    } catch (error) {
      setNotice(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  }

  function selectAircraft(id: string) {
    setSelected(id);
    setDraft(null);
    setHistory([]);
    setCursor(0);
    setAttest({});
    setIntent(null);
    setNotice("");
  }

  const shown = history.length ? history[cursor] : aircraft?.sample;
  const pointPath =
    draft?.points
      .map((p) => project(p.east_m, p.north_m).join(","))
      .join(" ") ?? "";

  return (
    <>
      <a className="skip" href="#main">
        Skip to main content
      </a>
      <header>
        <a className="brand" href="/">
          D<span>O</span>C <small>DRONE OPERATIONS CONSOLE</small>
        </a>
        <div className="header-actions">
          <span className="pill">SIMULATION ONLY</span>
          <button onClick={() => setHelp(!help)}>Operator guide</button>
          {user && (
            <button
              disabled={busy}
              onClick={() =>
                void perform(
                  async () => {
                    await request("/api/logout", "POST", {}, user.csrf);
                    setUser(null);
                    setFleet(null);
                  },
                  "Signed out",
                  false,
                )
              }
            >
              Sign out {user.name}
            </button>
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="intro">
          <div>
            <p className="eyebrow">GROUND STATION / TRAINING WORKSPACE</p>
            <h1>
              Every flight starts
              <br />
              with a clear picture.
            </h1>
            <p className="lede">
              Observe the fleet. Review the plan. Preserve the evidence.
            </p>
          </div>
          <aside className="scope">
            <strong>No real aircraft connected.</strong>
            <p>{fleet?.mode ?? "Private local workspace"}</p>
            <p>
              Not navigation, airspace clearance, emergency response or
              flight-qualified software.
            </p>
          </aside>
        </section>
        <p role="status" className="notice">
          {notice}
        </p>
        {help && (
          <section className="panel help" aria-label="Operator guide">
            <h2>From observation to evidence</h2>
            <ol>
              <li>
                Sign in with a CLI-provisioned account. Viewer accounts cannot
                change missions.
              </li>
              <li>
                Select an aircraft. Atlas is ready, Ember demonstrates low
                reserve, Relay demonstrates stale data.
              </li>
              <li>
                Edit a bounded local-grid plan and save it. Changes invalidate
                prior approval.
              </li>
              <li>
                Review all five checks, approve the current revision, then
                upload and start. Confirm the exact target.
              </li>
              <li>
                Inspect acknowledged results and actual observations separately.
                Hold/return are simulator requests, not guaranteed outcomes.
              </li>
              <li>
                Load retained replay or download JSON evidence. History retains
                300 observations per aircraft.
              </li>
            </ol>
            <p>
              Acknowledgements are not flight outcomes. Replay is a logical
              animation; PX4 evidence is tested separately in CI. No AI or
              third-party map service receives your data.
            </p>
          </section>
        )}
        {!user ? (
          <section className="panel login">
            <p className="eyebrow">PRIVATE WORKSPACE</p>
            <h2>Sign in to your console</h2>
            <form onSubmit={(event) => void login(event)}>
              <label>
                Username
                <input
                  name="username"
                  autoComplete="username"
                  required
                  maxLength={40}
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />
              </label>
              <button className="primary" disabled={busy}>
                Sign in
              </button>
            </form>
            <p>
              Create your own account using{" "}
              <code>python -m console --create-user your-name</code>. There is
              no default production password.
            </p>
          </section>
        ) : (
          <>
            <div className="workspace-title">
              <h2>Fleet overview</h2>
              <p>
                {user.name} / {user.role} · One workspace · SI units
              </p>
            </div>
            <div className="workspace">
              <aside className="fleet panel" aria-label="Aircraft selection">
                {fleet?.aircraft.map((item) => (
                  <button
                    key={item.id}
                    className={
                      selected === item.id ? "aircraft active" : "aircraft"
                    }
                    aria-pressed={selected === item.id}
                    onClick={() => selectAircraft(item.id)}
                  >
                    <span>{item.name}</span>
                    <small>
                      {freshness(item.sample?.received_at, now)} ·{" "}
                      {item.sample?.battery_pct.toFixed(0) ?? "—"}% battery
                    </small>
                    <em>{item.sample?.mode ?? "WAITING"}</em>
                  </button>
                ))}
                <p className="muted">
                  Local training grid. No external tiles, trackers or location
                  permissions.
                </p>
              </aside>
              <section
                className="panel map-panel"
                aria-label="Mission and position"
              >
                <div className="panel-title">
                  <h3>{aircraft?.name ?? "Connecting"}</h3>
                  <span>Revision {aircraft?.revision ?? "—"}</span>
                </div>
                <svg
                  viewBox="0 0 600 600"
                  role="img"
                  aria-label="Local training grid with draft route and observed aircraft position"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="90"
                      height="90"
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M 90 0 L 0 0 0 90" />
                    </pattern>
                  </defs>
                  <rect width="600" height="600" fill="url(#grid)" />
                  <circle cx="300" cy="300" r="270" className="envelope" />
                  <path d="M300 0V600M0 300H600" className="axes" />
                  <polyline
                    points={`300,300 ${pointPath} 300,300`}
                    className="route"
                  />
                  {draft?.points.map((p, i) => {
                    const [x, y] = project(p.east_m, p.north_m);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="7" className="waypoint" />
                        <text x={x + 12} y={y - 10}>
                          {i + 1}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="300" cy="300" r="5" className="home" />
                  {shown && (
                    <circle
                      cx={project(shown.east_m, shown.north_m)[0]}
                      cy={project(shown.east_m, shown.north_m)[1]}
                      r="11"
                      className="position"
                    />
                  )}
                  <text x="16" y="28">
                    N ↑
                  </text>
                  <text x="420" y="580">
                    GRID: 50 m / CELL
                  </text>
                </svg>
                <div className="telemetry">
                  <div>
                    <small>Altitude / relative</small>
                    <strong>{shown?.altitude_m.toFixed(1) ?? "—"} m</strong>
                  </div>
                  <div>
                    <small>Ground speed</small>
                    <strong>{shown?.speed_m_s.toFixed(1) ?? "—"} m/s</strong>
                  </div>
                  <div>
                    <small>Battery</small>
                    <strong>{shown?.battery_pct.toFixed(0) ?? "—"}%</strong>
                  </div>
                  <div>
                    <small>Arrival freshness</small>
                    <strong>{freshness(shown?.received_at, now)}</strong>
                  </div>
                </div>
                <p className="muted">
                  East {shown?.east_m.toFixed(1) ?? "—"} m · North{" "}
                  {shown?.north_m.toFixed(1) ?? "—"} m ·{" "}
                  {history.length ? "RETAINED REPLAY" : "LATEST OBSERVATION"}
                </p>
              </section>
              <section className="panel controls" aria-label="Plan editor">
                <p className="eyebrow">PLAN / REVIEW / EXECUTE</p>
                <h3>Mission workspace</h3>
                {draft && (
                  <>
                    <label>
                      Plan name
                      <input
                        value={draft.name}
                        maxLength={60}
                        disabled={!writable || busy}
                        onChange={(e) =>
                          setDraft({ ...draft, name: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Speed (m/s)
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.5"
                        value={draft.speed_m_s}
                        disabled={!writable || busy}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            speed_m_s: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <fieldset disabled={!writable || busy}>
                      <legend>Waypoints · meters</legend>
                      {draft.points.map((p, i) => (
                        <div className="point-row" key={i}>
                          {(["east_m", "north_m", "altitude_m"] as const).map(
                            (key) => (
                              <label key={key}>
                                {key === "east_m"
                                  ? "East"
                                  : key === "north_m"
                                    ? "North"
                                    : "Altitude"}{" "}
                                {i + 1}
                                <input
                                  type="number"
                                  value={p[key]}
                                  min={key === "altitude_m" ? 5 : -100}
                                  max={key === "altitude_m" ? 20 : 100}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      points: draft.points.map((v, j) =>
                                        i === j
                                          ? {
                                              ...v,
                                              [key]: Number(e.target.value),
                                            }
                                          : v,
                                      ),
                                    })
                                  }
                                />
                              </label>
                            ),
                          )}
                        </div>
                      ))}
                    </fieldset>
                    <p className="muted">
                      Horizontal route + return:{" "}
                      {routeLength(draft.points).toFixed(1)} m / 800 m
                    </p>
                    <button
                      disabled={!writable || busy}
                      onClick={() =>
                        void perform(async () => {
                          await request(
                            `/api/aircraft/${selected}/plan`,
                            "PUT",
                            { revision: draftRevision, plan: draft },
                            user.csrf,
                          );
                          setDraftRevision(draftRevision + 1);
                          setAttest({});
                        }, "Plan saved. Review and approve the new revision.")
                      }
                    >
                      Save plan
                    </button>
                    <button
                      disabled={busy || !aircraft}
                      onClick={() => {
                        if (aircraft) {
                          setDraft(structuredClone(aircraft.plan));
                          setDraftRevision(aircraft.revision);
                          setAttest({});
                        }
                      }}
                    >
                      Reload saved plan
                    </button>
                    {!draftMatches && (
                      <p className="muted">
                        Unsaved or stale draft: save or reload before
                        approving/uploading/starting.
                      </p>
                    )}
                  </>
                )}
                <fieldset disabled={!writable || busy}>
                  <legend>Preflight attestations</legend>
                  {Object.entries(checks).map(([key, label]) => (
                    <label className="check" key={key}>
                      <input
                        type="checkbox"
                        checked={attest[key] ?? false}
                        onChange={(e) =>
                          setAttest({ ...attest, [key]: e.target.checked })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <button
                  disabled={
                    !writable ||
                    !draftMatches ||
                    busy ||
                    !Object.keys(checks).every((key) => attest[key])
                  }
                  onClick={() =>
                    void perform(
                      () =>
                        request(
                          `/api/aircraft/${selected}/approve`,
                          "POST",
                          { revision: aircraft?.revision, checks: attest },
                          user.csrf,
                        ),
                      "Preflight recorded for this operator and revision.",
                    )
                  }
                >
                  Approve revision {aircraft?.revision}
                </button>
                <p className="muted">
                  Approved by {aircraft?.approved_by ?? "nobody"} · expires
                  after 10 minutes
                </p>
                <div className="command-row">
                  {["upload", "start", "hold", "return"].map((action) => (
                    <button
                      className={action === "start" ? "primary" : ""}
                      key={action}
                      disabled={
                        !writable ||
                        busy ||
                        !aircraft ||
                        ((action === "upload" || action === "start") &&
                          !draftMatches)
                      }
                      onClick={() =>
                        aircraft &&
                        setIntent({
                          aircraft: selected,
                          revision: aircraft.revision,
                          action,
                        })
                      }
                    >
                      {action[0].toUpperCase() + action.slice(1)}
                    </button>
                  ))}
                </div>
                <ul className="blockers">
                  {aircraft?.blockers.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
                <p className="muted">
                  The server rechecks freshness, revision, approval and exact
                  aircraft for every request.
                </p>
              </section>
            </div>
            <section className="panel evidence">
              <div className="panel-title">
                <h2>Observation & evidence</h2>
                <a href="/api/evidence" download>
                  Download JSON evidence ↓
                </a>
              </div>
              <div className="button-row">
                <button
                  onClick={() =>
                    void perform(async () => {
                      const value = await request<{ samples: Sample[] }>(
                        `/api/aircraft/${selected}/history`,
                      );
                      setHistory(value.samples);
                      setCursor(Math.max(0, value.samples.length - 1));
                    }, "Retained observations loaded; replay is not a command.")
                  }
                >
                  Load retained replay
                </button>
                <button
                  onClick={() => {
                    setHistory([]);
                    setCursor(0);
                  }}
                >
                  Back to latest
                </button>
                <button
                  onClick={() =>
                    void perform(
                      async () =>
                        setAudit(await request<Audit[]>("/api/audit")),
                      "Audit refreshed",
                    )
                  }
                >
                  Refresh audit
                </button>
              </div>
              {history.length > 0 && (
                <label>
                  Replay observation {cursor + 1} of {history.length}
                  <input
                    type="range"
                    min="0"
                    max={history.length - 1}
                    value={cursor}
                    onChange={(e) => setCursor(Number(e.target.value))}
                  />
                </label>
              )}
              <h3>Recent command intents</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Aircraft</th>
                      <th>Action</th>
                      <th>Result</th>
                      <th>Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleet?.commands.map((item) => (
                      <tr key={item.id}>
                        <td>{item.aircraft}</td>
                        <td>{item.action}</td>
                        <td>{item.status}</td>
                        <td>{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {fleet?.commands.length === 0 && (
                <p className="muted">
                  No command has been submitted. An acknowledgement is not
                  physical completion.
                </p>
              )}
              <h3>Audit timeline</h3>
              <ol className="audit">
                {audit.map((event) => (
                  <li key={event.id}>
                    <strong>{event.event}</strong> · {event.aircraft} ·{" "}
                    {event.actor}
                    <p>{event.detail}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
        {intent && (
          <dialog
            ref={dialogRef}
            onCancel={() => setIntent(null)}
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">Confirm simulation command</h2>
            <p>
              <strong>{intent.action.toUpperCase()}</strong> → {intent.aircraft}{" "}
              / revision {intent.revision}
            </p>
            <p>
              No real aircraft. If the target or plan changes, cancel and review
              again.
            </p>
            <div className="button-row">
              <button onClick={() => setIntent(null)}>Cancel</button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => {
                  const captured = intent;
                  setIntent(null);
                  void perform(
                    () =>
                      request(
                        `/api/aircraft/${captured.aircraft}/commands`,
                        "POST",
                        {
                          aircraft_id: captured.aircraft,
                          revision: captured.revision,
                          action: captured.action,
                        },
                        user?.csrf,
                        crypto.randomUUID(),
                      ),
                    "Intent recorded. Inspect command status and observed state.",
                  );
                }}
              >
                Confirm {intent.action}
              </button>
            </div>
          </dialog>
        )}
      </main>
      <footer>
        <strong>Designed & engineered by Jason Stys</strong>
        <a href="https://github.com/JasonStys/drone-operations-console">
          Source & help
        </a>
        <a href="https://www.linkedin.com/in/jason-stys-31b30b351/">
          Contact Jason
        </a>
        <span>Simulator-only engineering portfolio · v0.1.0</span>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
