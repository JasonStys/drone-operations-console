/** @file Jason Stys: bounded data-only scene interchange. Exact declarations: docs/SOURCE_MAP.md. */
import { prepare, type Exercise, type XY } from "./rehearsal";

export const MAX_SCENE_BYTES = 32768;

/** Require only authored fields; imported properties never become executable configuration. */
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Scene entries must be objects.");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).sort().join("|") !== [...keys].sort().join("|"))
    throw new Error("Scene fields are missing or unsupported.");
  return result;
}

/** Accept bounded visible text; React renders names as text, never HTML. */
function text(value: unknown, maximum: number): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > maximum ||
    /[\u0000-\u001f\u007f-\u009f\uD800-\uDFFF]/u.test(value)
  )
    throw new Error(`Scene text must contain 1–${maximum} visible characters.`);
  return value.trim();
}

/** Numeric geometry must be explicit and finite, never coercible strings or booleans. */
function finite(value: unknown, low: number, high: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < low ||
    value > high
  )
    throw new Error(
      `Scene values must be finite numbers between ${low} and ${high}.`,
    );
  return value;
}

/** Read one point without inferring latitude, altitude or flight-controller coordinates. */
function point(value: unknown): XY {
  const data = object(value, ["east", "north"]);
  return {
    east: finite(data.east, -120, 120),
    north: finite(data.north, -120, 120),
  };
}

/** Parse at most 32 KiB / 3 friendly routes / 8 waypoints / 8 disks before any path allocation. */
export function parseScene(source: string): Exercise {
  if (
    source.length > MAX_SCENE_BYTES ||
    new TextEncoder().encode(source).length > MAX_SCENE_BYTES
  )
    throw new Error("A scene must be at most 32 KiB.");
  const data = object(JSON.parse(source), [
    "schema",
    "simulation_only",
    "name",
    "description",
    "routes",
    "obstacles",
  ]);
  if (data.schema !== 1 || data.simulation_only !== true)
    throw new Error("Only version 1 simulation-only scenes are supported.");
  if (
    !Array.isArray(data.routes) ||
    data.routes.length < 1 ||
    data.routes.length > 3 ||
    !Array.isArray(data.obstacles) ||
    data.obstacles.length > 8
  )
    throw new Error("Use 1–3 cooperative routes and at most 8 obstacles.");
  const routes = data.routes.map((raw) => {
    const route = object(raw, ["id", "name", "speed", "points"]);
    const id = text(route.id, 24);
    if (!/^[A-Za-z0-9][A-Za-z0-9 _-]*$/.test(id))
      throw new Error("Aircraft IDs need letters, digits, spaces, _ or -.");
    if (
      !Array.isArray(route.points) ||
      route.points.length < 2 ||
      route.points.length > 8
    )
      throw new Error("Each route needs 2–8 waypoints.");
    return {
      id,
      name: text(route.name, 60),
      speed: finite(route.speed, 1, 8),
      points: route.points.map(point),
    };
  });
  if (new Set(routes.map((route) => route.id)).size !== routes.length)
    throw new Error("Aircraft IDs must be unique.");
  const obstacles = data.obstacles.map((raw) => {
    const disk = object(raw, ["east", "north", "radius"]);
    return {
      east: finite(disk.east, -120, 120),
      north: finite(disk.north, -120, 120),
      radius: finite(disk.radius, 1, 35),
    };
  });
  const scene = {
    name: text(data.name, 80),
    description: text(data.description, 400),
    routes,
    obstacles,
  };
  prepare(scene); // Validate safe initial separation and starting positions before accepting a scene.
  return scene;
}

/** Export scene inputs only, excluding derived paths, account information and fleet records. */
export function sceneDocument(scene: Exercise): string {
  const serialized = JSON.stringify(
    {
      schema: 1,
      simulation_only: true,
      name: scene.name,
      description: scene.description,
      routes: scene.routes,
      obstacles: scene.obstacles,
    },
    null,
    2,
  );
  parseScene(serialized);
  return serialized;
}

/** Read stable UTF-8 bytes without silently replacing malformed characters. */
export async function readSceneFile(
  file: Pick<File, "size" | "arrayBuffer">,
): Promise<Exercise> {
  if (
    !Number.isSafeInteger(file.size) ||
    file.size < 1 ||
    file.size > MAX_SCENE_BYTES
  )
    throw new Error("A scene must be nonempty and at most 32 KiB.");
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength !== file.size || bytes.byteLength > MAX_SCENE_BYTES)
    throw new Error("Scene size changed while reading; choose the file again.");
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Scene files must use valid UTF-8 JSON.");
  }
  return parseScene(source);
}
