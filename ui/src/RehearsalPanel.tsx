/** @file Jason Stys: animated local exercises, future paths and editable obstacle disks. State/functions: docs/SOURCE_MAP.md. */
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { SceneEditor } from "./SceneEditor";
import { readSceneFile, sceneDocument } from "./rehearsal-scenes";
import {
  distance,
  frameAt,
  prepare,
  scenario,
  CLEARANCE,
  type Obstacle,
  type Exercise,
  type XY,
} from "./rehearsal";

/** Project local meters into this exercise's independent SVG viewport. */
function svg(point: XY): string {
  return `${300 + point.east * 2},${300 - point.north * 2}`;
}

/** Local exercise state never modifies the reviewed fleet or invokes aircraft APIs. */
export function Rehearsal() {
  const [preset, setPreset] = useState("detour");
  const [scene, setScene] = useState<Exercise>(() => scenario("detour"));
  const obstacles = scene.obstacles;
  const generation = useRef(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [showFuture, setShowFuture] = useState(true);
  const exercise = useMemo(() => prepare(scene), [scene]);
  const frame = frameAt(exercise, time);
  useEffect(() => {
    if (!running) return;
    let handle: number;
    let previous: number | undefined;
    const animate = (stamp: number) => {
      if (previous !== undefined) {
        const delta = Math.min(0.1, Math.max(0, (stamp - previous) / 1000));
        setTime((value) => Math.min(value + delta, exercise.stop));
      }
      previous = stamp;
      handle = requestAnimationFrame(animate);
    };
    handle = requestAnimationFrame(animate);
    const visibility = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(handle);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [running, exercise.stop]);
  useEffect(() => {
    if (frame.finished) setRunning(false);
  }, [frame.finished]);

  /** Scene edits always start a new paused clock. */
  function reset(next: Obstacle[] = obstacles) {
    generation.current++;
    setRunning(false);
    setTime(0);
    setError("");
    setScene({ ...scene, obstacles: next });
  }
  /** Atomic input replacement never rewrites the reviewed fleet mission. */
  function applyScene(next: Exercise, selected = "custom") {
    prepare(next);
    generation.current++;
    setScene(next);
    setPreset(selected);
    setRunning(false);
    setTime(0);
    setError("");
  }
  /** Bounded local import; a later edit invalidates a pending file read. */
  async function importScene(file: File | undefined) {
    if (!file) return;
    const revision = ++generation.current;
    try {
      const next = await readSceneFile(file);
      if (revision !== generation.current) return;
      applyScene(next);
    } catch (failure) {
      if (revision === generation.current)
        setError(
          failure instanceof Error ? failure.message : "Invalid scene file",
        );
    }
  }
  /** Save reusable scene inputs separately from time-indexed evidence. */
  function downloadScene() {
    const url = URL.createObjectURL(
      new Blob([sceneDocument(scene)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "cooperative-scene.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  /** Check bounded geometry before accepting a user-authored disk. */
  function addObstacle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const obstacle = {
      east: Number(data.get("east")),
      north: Number(data.get("north")),
      radius: Number(data.get("radius")),
    };
    try {
      prepare({ ...scene, obstacles: [...obstacles, obstacle] });
      reset([...obstacles, obstacle]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid obstacle");
    }
  }
  /** Export bounded synthetic evidence, without fleet records, account data or secrets. */
  function download() {
    const evidence = {
      schema: 1,
      author: "Jason Stys",
      simulation_only: true,
      model: "2D constant-speed cooperative route rehearsal",
      exercise,
      frame,
      samples: Array.from({ length: Math.floor(frame.time) + 1 }, (_, t) =>
        frameAt(exercise, t),
      ),
      limitations: [
        "No real flight dynamics",
        "No pursuit, evasion or aircraft commands",
        "Conservative grid failure",
        "No altitude or wind model",
      ],
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(evidence, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "route-rehearsal.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  return (
    <section
      id="route-rehearsal"
      className="panel rehearsal"
      aria-label="Animated route rehearsal"
    >
      <div className="panel-title">
        <div>
          <p className="eyebrow">INTERACTIVE / LOCAL EXERCISE</p>
          <h2>Flight path rehearsal</h2>
        </div>
        <span className="pill">NO AIRCRAFT COMMANDS</span>
      </div>
      <p>
        Animate planned routes, inspect the next 10 seconds, and add circular
        obstacles. Cooperative rendezvous uses agreed endpoints and a 20 m
        stand-off.
      </p>
      <div className="rehearsal-layout">
        <div>
          <svg
            viewBox="0 0 600 600"
            role="img"
            aria-label="Animated aircraft routes, future projections and circular obstacles"
          >
            <defs>
              <pattern
                id="rehearsal-grid"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <path d="M100 0H0V100" className="axes" />
              </pattern>
            </defs>
            <rect
              x="60"
              y="60"
              width="480"
              height="480"
              fill="url(#rehearsal-grid)"
              className="rehearsal-boundary"
            />
            {obstacles.map((o, i) => (
              <g key={i}>
                <circle
                  cx={300 + o.east * 2}
                  cy={300 - o.north * 2}
                  r={(o.radius + CLEARANCE) * 2}
                  className="obstacle-margin"
                />
                <circle
                  cx={300 + o.east * 2}
                  cy={300 - o.north * 2}
                  r={o.radius * 2}
                  className="obstacle"
                />
                <text
                  x={300 + o.east * 2}
                  y={300 - o.north * 2}
                  textAnchor="middle"
                >
                  {i + 1}
                </text>
              </g>
            ))}
            {exercise.paths.map(
              (path, i) =>
                path && (
                  <polyline
                    key={i}
                    points={path.map(svg).join(" ")}
                    className={`planned aircraft-${i}`}
                  />
                ),
            )}
            {frame.aircraft.map((a, i) => (
              <g key={a.id}>
                {showFuture && (
                  <polyline
                    points={a.projected.map(svg).join(" ")}
                    className={`projected aircraft-${i}`}
                  />
                )}
                <g
                  transform={`translate(${svg(a.point)})`}
                  data-testid={`moving-aircraft-${i}`}
                >
                  <circle r="2" className={`moving aircraft-${i}`} />
                  <path d="M-2 -2L2 2M-2 2L2 -2" className="drone-cross" />
                  <text x="16" y="-14">
                    {a.name}
                  </text>
                </g>
              </g>
            ))}
            <text x="20" y="28">
              N ↑ · 2D meters
            </text>
            <text x="20" y="582">
              50 m / cell · dashed: 10 s projection · outline: +3 m
            </text>
          </svg>
          <p className="rehearsal-phase" aria-live="polite">
            {frame.phase}
          </p>
          <p className="muted" data-testid="exercise-clock">
            Elapsed {frame.time.toFixed(1)} s / {exercise.duration.toFixed(1)} s
          </p>
          <div className="rehearsal-actions">
            <button
              onClick={() => setRunning(!running)}
              disabled={frame.finished}
            >
              {running ? "Pause rehearsal" : "Play rehearsal"}
            </button>
            <button
              disabled={running || frame.finished}
              onClick={() =>
                setTime((value) => Math.min(value + 1, exercise.stop))
              }
            >
              Step 1 second
            </button>
            <button onClick={() => reset()}>Reset rehearsal</button>
            <button onClick={download}>Download rehearsal evidence</button>
          </div>
          <label>
            Replay time (seconds)
            <input
              type="range"
              min="0"
              max={Math.max(exercise.stop, 0.1)}
              step="0.1"
              value={time}
              disabled={running || exercise.stop === 0}
              onChange={(event) => setTime(Number(event.target.value))}
            />
          </label>
          <p className="muted">
            Scrub while paused to inspect or repeat a moment. Display markers
            have a 1 m radius; the model uses point centerlines and 3 m obstacle
            clearance, not a physical aircraft footprint.
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={showFuture}
              onChange={(e) => setShowFuture(e.target.checked)}
            />
            Show projected paths
          </label>
          <div
            className="table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Aircraft position table"
          >
            <table>
              <caption>Synthetic aircraft positions</caption>
              <thead>
                <tr>
                  <th>Aircraft</th>
                  <th>East / north (m)</th>
                  <th>Speed (m/s)</th>
                </tr>
              </thead>
              <tbody>
                {frame.aircraft.map((a) => (
                  <tr key={a.id}>
                    <th>{a.name}</th>
                    <td>
                      {a.point.east.toFixed(1)} / {a.point.north.toFixed(1)}
                    </td>
                    <td>{a.speed.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {frame.aircraft.length > 1 && (
            <p>
              Aircraft separation:{" "}
              {distance(
                frame.aircraft[0]!.point,
                frame.aircraft[1]!.point,
              ).toFixed(1)}{" "}
              m · minimum 8 m.
            </p>
          )}
        </div>
        <div>
          <label>
            Rehearsal scenario
            <select
              value={preset}
              onChange={(e) => {
                applyScene(scenario(e.target.value), e.target.value);
              }}
            >
              {preset === "custom" && (
                <option value="custom">Custom cooperative scene</option>
              )}
              <option value="detour">Obstacle detour</option>
              <option value="survey">Perimeter inspection</option>
              <option value="meeting">Cooperative rendezvous</option>
              <option value="crossing">Crossing traffic hold</option>
              <option value="blocked">Blocked corridor</option>
            </select>
          </label>
          <h3>{exercise.name}</h3>
          <p>{exercise.description}</p>
          <div className="scene-transfer">
            <button onClick={downloadScene}>Save reusable scene</button>
            <label>
              Open reusable scene
              <input
                type="file"
                accept=".json,application/json"
                disabled={running}
                onChange={(event) => {
                  void importScene(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <p className="muted">
              Version 1 JSON, 32 KiB maximum. Only local cooperative scene data;
              imported content is never sent to the fleet API.
            </p>
          </div>
          <SceneEditor scene={scene} disabled={running} apply={applyScene} />
          <form onSubmit={addObstacle}>
            <fieldset disabled={running || obstacles.length >= 8}>
              <legend>Add obstacle · meters</legend>
              <label>
                Obstacle east
                <input
                  name="east"
                  type="number"
                  min="-120"
                  max="120"
                  step="any"
                  defaultValue="35"
                  required
                />
              </label>
              <label>
                Obstacle north
                <input
                  name="north"
                  type="number"
                  min="-120"
                  max="120"
                  step="any"
                  defaultValue="-40"
                  required
                />
              </label>
              <label>
                Obstacle radius
                <input
                  name="radius"
                  type="number"
                  min="1"
                  max="35"
                  step="any"
                  defaultValue="12"
                  required
                />
              </label>
              <button>Add obstacle</button>
            </fieldset>
          </form>
          <p className="muted">
            {obstacles.length}/8 disks. Editing resets the clock. Full-height
            exclusion areas; no altitude bypass.
          </p>
          <p role="alert" aria-label="Scene interchange error">
            {error}
          </p>
          <ul className="obstacle-list">
            {obstacles.map((o, i) => (
              <li key={i}>
                Disk {i + 1}: ({o.east}, {o.north}), radius {o.radius} m{" "}
                <button
                  disabled={running}
                  onClick={() => reset(obstacles.filter((_, j) => i !== j))}
                >
                  Remove obstacle {i + 1}
                </button>
              </li>
            ))}
          </ul>
          <p className="muted">
            Separate from the reviewed mission and PX4 adapter. No target
            identification, pursuit/evasion, live aircraft connection, wind,
            altitude or certified collision prediction. A blocked route or
            separation hold needs a reset or revised scene.
          </p>
        </div>
      </div>
    </section>
  );
}
