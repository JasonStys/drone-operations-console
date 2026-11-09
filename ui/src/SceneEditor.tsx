/** @file Jason Stys: friendly route/waypoint editor with explicit draft/apply semantics. Lines: docs/SOURCE_MAP.md. */
import { useState, type FormEvent } from "react";
import type { Exercise } from "./rehearsal";
import { parseScene } from "./rehearsal-scenes";

/** Keep incomplete numeric edits as text until the user deliberately submits a whole scene. */
function draftOf(scene: Exercise) {
  return {
    name: scene.name,
    description: scene.description,
    routes: scene.routes.map((route) => ({
      id: route.id,
      name: route.name,
      speed: String(route.speed),
      points: route.points.map((point) => ({
        east: String(point.east),
        north: String(point.north),
      })),
    })),
  };
}

/** Edit a bounded local draft; failures keep the active exercise and clock unchanged. */
export function SceneEditor({
  scene,
  disabled,
  apply,
}: {
  scene: Exercise;
  disabled: boolean;
  apply: (next: Exercise) => void;
}) {
  const [draft, setDraft] = useState(() => draftOf(scene));
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (
        draft.routes.some(
          (route) =>
            !route.speed.trim() ||
            route.points.some(
              (point) => !point.east.trim() || !point.north.trim(),
            ),
        )
      )
        throw new Error(
          "Complete every speed and coordinate before applying the draft.",
        );
      const next = parseScene(
        JSON.stringify({
          schema: 1,
          simulation_only: true,
          ...draft,
          routes: draft.routes.map((route) => ({
            ...route,
            speed: Number(route.speed),
            points: route.points.map((point) => ({
              east: Number(point.east),
              north: Number(point.north),
            })),
          })),
          obstacles: scene.obstacles,
        }),
      );
      apply(next);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Invalid scene");
    }
  }
  return (
    <details className="scene-editor">
      <summary>Build a reusable cooperative scene</summary>
      <p>
        Draft edits take effect only after Apply. Copy current scene discards
        this draft. Existing obstacle disks are retained; edit them with the
        obstacle controls. Coordinates are local meters, not real aircraft
        commands.
      </p>
      <button
        disabled={disabled}
        onClick={() => {
          setDraft(draftOf(scene));
          setError("");
        }}
      >
        Copy current scene into editor
      </button>
      <form onSubmit={submit}>
        <fieldset disabled={disabled}>
          <legend>Scene draft</legend>
          <label>
            Scene name
            <input
              value={draft.name}
              maxLength={80}
              required
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </label>
          <label>
            Scene purpose
            <input
              value={draft.description}
              maxLength={400}
              required
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
          </label>
          {draft.routes.map((route, index) => (
            <fieldset key={index}>
              <legend>Friendly aircraft {index + 1}</legend>
              <label>
                Aircraft {index + 1} ID
                <input
                  value={route.id}
                  maxLength={24}
                  required
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      routes: draft.routes.map((item, i) =>
                        i === index
                          ? { ...item, id: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Aircraft {index + 1} name
                <input
                  value={route.name}
                  maxLength={60}
                  required
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      routes: draft.routes.map((item, i) =>
                        i === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Aircraft {index + 1} speed (m/s)
                <input
                  type="number"
                  min="1"
                  max="8"
                  step="any"
                  value={route.speed}
                  required
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      routes: draft.routes.map((item, i) =>
                        i === index
                          ? { ...item, speed: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              {route.points.map((point, waypoint) => (
                <div className="scene-point" key={waypoint}>
                  <label>
                    Aircraft {index + 1} waypoint {waypoint + 1} east
                    <input
                      type="number"
                      min="-120"
                      max="120"
                      step="any"
                      value={point.east}
                      required
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          routes: draft.routes.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  points: item.points.map((p, j) =>
                                    j === waypoint
                                      ? { ...p, east: event.target.value }
                                      : p,
                                  ),
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Aircraft {index + 1} waypoint {waypoint + 1} north
                    <input
                      type="number"
                      min="-120"
                      max="120"
                      step="any"
                      value={point.north}
                      required
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          routes: draft.routes.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  points: item.points.map((p, j) =>
                                    j === waypoint
                                      ? { ...p, north: event.target.value }
                                      : p,
                                  ),
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={route.points.length <= 2}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        routes: draft.routes.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                points: item.points.filter(
                                  (_, j) => j !== waypoint,
                                ),
                              }
                            : item,
                        ),
                      })
                    }
                  >
                    Remove aircraft {index + 1} waypoint {waypoint + 1}
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={route.points.length >= 8}
                onClick={() =>
                  setDraft({
                    ...draft,
                    routes: draft.routes.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            points: [
                              ...item.points,
                              { ...item.points.at(-1)! },
                            ],
                          }
                        : item,
                    ),
                  })
                }
              >
                Add aircraft {index + 1} waypoint
              </button>
              <button
                type="button"
                disabled={draft.routes.length <= 1}
                onClick={() =>
                  setDraft({
                    ...draft,
                    routes: draft.routes.filter((_, i) => i !== index),
                  })
                }
              >
                Remove aircraft {index + 1}
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={draft.routes.length >= 3}
            onClick={() => {
              const id = [
                "friendly-1",
                "friendly-2",
                "friendly-3",
                "friendly-4",
              ].find(
                (value) => !draft.routes.some((route) => route.id === value),
              )!;
              setDraft({
                ...draft,
                routes: [
                  ...draft.routes,
                  {
                    id,
                    name: id,
                    speed: "5",
                    points: [
                      { east: "-100", north: "80" },
                      { east: "100", north: "80" },
                    ],
                  },
                ],
              });
            }}
          >
            Add cooperative aircraft
          </button>
          <button>Apply scene draft</button>
        </fieldset>
      </form>
      <p role="alert" aria-label="Scene draft error">
        {error}
      </p>
    </details>
  );
}
