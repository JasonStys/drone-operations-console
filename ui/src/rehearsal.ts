/** @file Jason Stys: deterministic local route rehearsal, inflated obstacles and cooperative separation holds. Declarations: docs/SOURCE_MAP.md. */
export type XY = { east: number; north: number };
export type Obstacle = XY & { radius: number };
export type Route = { id: string; name: string; points: XY[]; speed: number };
export type Exercise = {
  name: string;
  description: string;
  routes: Route[];
  obstacles: Obstacle[];
};
export type Prepared = Exercise & {
  paths: (XY[] | null)[];
  duration: number;
  stop: number;
  blocked: boolean;
  limited: boolean;
};
export const BOUND = 120;
export const CLEARANCE = 3;
export const SEPARATION = 8;
const CELL = 5;
const WIDTH = 49;
const NODES = WIDTH * WIDTH;
const EPSILON = 1e-8;

/** Euclidean SI distance; pure input data never contain geographic coordinates. */
export function distance(a: XY, b: XY): number {
  return Math.hypot(a.east - b.east, a.north - b.north);
}

/** Distance to a closed segment, including stationary and endpoint cases. */
export function segmentDistance(p: XY, a: XY, b: XY): number {
  const dx = b.east - a.east;
  const dy = b.north - a.north;
  const squared = dx * dx + dy * dy;
  const t =
    squared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((p.east - a.east) * dx + (p.north - a.north) * dy) / squared,
          ),
        );
  return distance(p, { east: a.east + t * dx, north: a.north + t * dy });
}

/** The complete swept segment must clear each disk plus a fixed 3 m margin. */
export function clearSegment(a: XY, b: XY, obstacles: Obstacle[]): boolean {
  return obstacles.every(
    (o) => segmentDistance(o, a, b) > o.radius + CLEARANCE + EPSILON,
  );
}

/** Reject nonfinite/out-of-bounds inputs before bounded graph allocation. */
function validPoint(p: XY): boolean {
  return (
    Number.isFinite(p.east) &&
    Number.isFinite(p.north) &&
    Math.abs(p.east) <= BOUND &&
    Math.abs(p.north) <= BOUND
  );
}

/** Binary min-heap permits duplicate improvements; popped stale entries are discarded by A*. */
class MinHeap {
  entries: { id: number; score: number }[] = [];
  /** Bubble an improved node up in O(log V). */
  push(id: number, score: number): void {
    const entry = { id, score };
    let index = this.entries.length;
    this.entries.push(entry);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.entries[parent]!.score <= score) break;
      this.entries[index] = this.entries[parent]!;
      index = parent;
    }
    this.entries[index] = entry;
  }
  /** Remove the smallest estimated cost in O(log V). */
  pop(): { id: number; score: number } | undefined {
    const first = this.entries[0];
    const last = this.entries.pop();
    if (!last || !this.entries.length) return first;
    let index = 0;
    while (2 * index + 1 < this.entries.length) {
      let child = 2 * index + 1;
      if (
        child + 1 < this.entries.length &&
        this.entries[child + 1]!.score < this.entries[child]!.score
      )
        child++;
      if (this.entries[child]!.score >= last.score) break;
      this.entries[index] = this.entries[child]!;
      index = child;
    }
    this.entries[index] = last;
    return first;
  }
}

/** A* on a fixed 5 m grid with continuous endpoint links and exact disk/edge checks.
 * At most 2403 vertices; O((V+E) log V * O) time and O(V) auxiliary space,
 * O <= 8 obstacles. Failure is conservative: no path on this discretization.
 */
export function planPath(
  start: XY,
  goal: XY,
  obstacles: Obstacle[],
): XY[] | null {
  if (
    !validPoint(start) ||
    !validPoint(goal) ||
    obstacles.length > 8 ||
    obstacles.some(
      (o) =>
        !validPoint(o) ||
        !Number.isFinite(o.radius) ||
        o.radius < 1 ||
        o.radius > 35,
    )
  )
    throw new Error(
      "Use finite coordinates within ±120 m, at most eight disks, and radii 1–35 m.",
    );
  if (
    !clearSegment(start, start, obstacles) ||
    !clearSegment(goal, goal, obstacles)
  )
    return null;
  if (clearSegment(start, goal, obstacles)) return [start, goal];
  const point = (id: number): XY =>
    id === NODES
      ? start
      : id === NODES + 1
        ? goal
        : {
            east: (id % WIDTH) * CELL - BOUND,
            north: Math.floor(id / WIDTH) * CELL - BOUND,
          };
  const cost = new Float64Array(NODES + 2).fill(Infinity);
  const previous = new Int32Array(NODES + 2).fill(-1);
  const closed = new Uint8Array(NODES + 2);
  const heap = new MinHeap();
  const startLinks: number[] = [];
  for (let id = 0; id < NODES; id++)
    if (distance(start, point(id)) <= CELL * 1.5) startLinks.push(id);
  cost[NODES] = 0;
  heap.push(NODES, distance(start, goal));
  while (heap.entries.length) {
    const current = heap.pop()!.id;
    if (closed[current]) continue;
    closed[current] = 1;
    if (current === NODES + 1) {
      const result: XY[] = [];
      for (let id = current; id !== -1; id = previous[id]!)
        result.push(point(id));
      return result.reverse();
    }
    const here = point(current);
    const neighbors = current === NODES ? [...startLinks] : [];
    if (current < NODES) {
      const x = current % WIDTH;
      const y = Math.floor(current / WIDTH);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (
            (dx || dy) &&
            x + dx >= 0 &&
            x + dx < WIDTH &&
            y + dy >= 0 &&
            y + dy < WIDTH
          )
            neighbors.push((y + dy) * WIDTH + x + dx);
      if (distance(here, goal) <= CELL * 1.5) neighbors.push(NODES + 1);
    }
    for (const next of neighbors) {
      if (closed[next]) continue;
      const there = point(next);
      const improved = cost[current]! + distance(here, there);
      if (improved < cost[next]! && clearSegment(here, there, obstacles)) {
        cost[next] = improved;
        previous[next] = current;
        heap.push(next, improved + distance(there, goal));
      }
    }
  }
  return null;
}

/** Total horizontal distance of an already validated polyline, O(P). */
export function pathLength(points: XY[]): number {
  return points
    .slice(1)
    .reduce(
      (total, point, index) => total + distance(points[index]!, point),
      0,
    );
}

/** Follow the predetermined path at constant speed, then hold at its endpoint. */
export function positionAt(points: XY[], speed: number, time: number): XY {
  if (
    !points.length ||
    !Number.isFinite(time) ||
    time < 0 ||
    !Number.isFinite(speed) ||
    speed <= 0
  )
    throw new Error(
      "A path, positive speed and finite nonnegative time are required.",
    );
  let remaining = time * speed;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1]!;
    const b = points[index]!;
    const length = distance(a, b);
    if (length > 0 && remaining < length) {
      const t = remaining / length;
      return {
        east: a.east + (b.east - a.east) * t,
        north: a.north + (b.north - a.north) * t,
      };
    }
    remaining -= length;
  }
  return points.at(-1)!;
}

/** Exact swept relative-motion separation for two straight movement segments. */
export function sweptSeparation(a0: XY, a1: XY, b0: XY, b1: XY): number {
  return segmentDistance(
    { east: 0, north: 0 },
    { east: a0.east - b0.east, north: a0.north - b0.north },
    { east: a1.east - b1.east, north: a1.north - b1.north },
  );
}

/** Plan <= 3 friendly routes, and find a conservative global hold before loss of separation.
 * Relative speed is bounded by 16 m/s. The 0.8 m inflation covers a full
 * 0.05 s interval even at bends; swept straight-segment checks may hold early.
 */
export function prepare(exercise: Exercise): Prepared {
  if (
    !exercise.routes.length ||
    exercise.routes.length > 3 ||
    exercise.routes.some(
      (route) =>
        !Number.isFinite(route.speed) ||
        route.speed < 1 ||
        route.speed > 8 ||
        route.points.length < 2 ||
        route.points.length > 8,
    )
  )
    throw new Error("Invalid bounded exercise");
  if (
    exercise.routes.some(
      (route) =>
        !clearSegment(route.points[0]!, route.points[0]!, exercise.obstacles),
    )
  )
    throw new Error(
      "A starting point is inside an obstacle's clearance area. Move the start or obstacle.",
    );
  for (let a = 0; a < exercise.routes.length; a++)
    for (let b = a + 1; b < exercise.routes.length; b++)
      if (
        distance(
          exercise.routes[a]!.points[0]!,
          exercise.routes[b]!.points[0]!,
        ) < SEPARATION
      )
        throw new Error(
          "Friendly starting points need at least 8 m separation.",
        );
  const paths = exercise.routes.map((route) => {
    const result: XY[] = [];
    for (let i = 1; i < route.points.length; i++) {
      const leg = planPath(
        route.points[i - 1]!,
        route.points[i]!,
        exercise.obstacles,
      );
      if (!leg) return null;
      result.push(...(i === 1 ? leg : leg.slice(1)));
    }
    return result;
  });
  const blocked = paths.some((path) => !path);
  const plannedDuration = Math.max(
    ...paths.map((path, i) =>
      path ? pathLength(path) / exercise.routes[i]!.speed : 0,
    ),
  );
  const duration = Math.min(180, plannedDuration);
  let stop = blocked ? 0 : duration;
  // Relative speed <= 16 m/s. Inflate the separation check by one whole step's
  // maximum travel (0.8 m); this covers bends between checks, not just endpoints.
  for (let step = 0; !blocked && step * 0.05 <= duration; step++) {
    const t = step * 0.05;
    const positions = paths.map((path, i) =>
      positionAt(path!, exercise.routes[i]!.speed, t),
    );
    const before = paths.map((path, i) =>
      positionAt(path!, exercise.routes[i]!.speed, Math.max(0, t - 0.05)),
    );
    let conflict = false;
    for (let a = 0; a < positions.length; a++)
      for (let b = a + 1; b < positions.length; b++)
        if (
          sweptSeparation(
            before[a]!,
            positions[a]!,
            before[b]!,
            positions[b]!,
          ) <=
          SEPARATION + 0.8
        )
          conflict = true;
    if (conflict) {
      stop = Math.max(0, t - 0.05);
      break;
    }
  }
  return {
    ...exercise,
    paths,
    blocked,
    duration,
    stop,
    limited: plannedDuration > 180,
  };
}

/** Return a deterministic scene and future route samples; never send commands or solve pursuit. */
export function frameAt(exercise: Prepared, requested: number) {
  if (!Number.isFinite(requested) || requested < 0)
    throw new Error("Invalid exercise clock");
  const time = Math.min(requested, exercise.stop);
  const phase = exercise.blocked
    ? "Route unavailable — all aircraft holding"
    : exercise.stop < exercise.duration && requested >= exercise.stop
      ? "Separation hold — reset or change scenario"
      : requested >= exercise.duration
        ? exercise.limited
          ? "Exercise time limit — all aircraft holding"
          : "Routes complete — holding at agreed endpoints"
        : "Following planned routes";
  const aircraft = exercise.routes.map((route, index) => {
    const path = exercise.paths[index];
    const point = path ? positionAt(path, route.speed, time) : route.points[0]!;
    const projected = path
      ? Array.from({ length: 21 }, (_, i) =>
          positionAt(
            path,
            route.speed,
            Math.min(time + i * 0.5, exercise.stop),
          ),
        )
      : [point];
    return {
      id: route.id,
      name: route.name,
      point,
      projected,
      speed:
        path && time < Math.min(exercise.stop, pathLength(path) / route.speed)
          ? route.speed
          : 0,
    };
  });
  return { time, phase, aircraft, finished: requested >= exercise.stop };
}

/** Fixed cooperative scenarios use no tracking input, pursuit/evasion, or aircraft adapter. */
export function scenario(name: string): Exercise {
  const route = (id: string, points: [number, number][]): Route => ({
    id,
    name: id,
    speed: 5,
    points: points.map(([east, north]) => ({ east, north })),
  });
  switch (name) {
    case "detour":
      return {
        name: "Obstacle detour",
        description:
          "A fictional inspection drone routes around a circular exclusion area.",
        routes: [
          route("Survey", [
            [-100, 0],
            [100, 0],
          ]),
        ],
        obstacles: [{ east: 0, north: 0, radius: 24 }],
      };
    case "meeting":
      return {
        name: "Cooperative rendezvous",
        description:
          "Two friendly couriers follow agreed routes and hold 20 m apart at a shared meeting area. Neither chases the other.",
        routes: [
          route("Courier A", [
            [-100, -60],
            [0, 0],
          ]),
          route("Courier B", [
            [100, 60],
            [0, 20],
          ]),
        ],
        obstacles: [],
      };
    case "crossing":
      return {
        name: "Crossing traffic hold",
        description:
          "Both friendly aircraft stop before their crossing routes breach the 8 m separation margin.",
        routes: [
          route("Eastbound", [
            [-100, 0],
            [100, 0],
          ]),
          route("Northbound", [
            [0, -100],
            [0, 100],
          ]),
        ],
        obstacles: [],
      };
    case "blocked":
      return {
        name: "Blocked corridor",
        description:
          "Overlapping exclusion areas block the grid. No route is invented through an obstacle.",
        routes: [
          route("Survey", [
            [-100, 0],
            [100, 0],
          ]),
        ],
        obstacles: [-100, -50, 0, 50, 100].map((north) => ({
          east: 0,
          north,
          radius: 30,
        })),
      };
    case "survey":
      return {
        name: "Perimeter inspection",
        description:
          "A fictional warehouse perimeter route at constant 5 m/s. Positions are synthetic, in a flat 2D training grid.",
        routes: [
          route("Inspector", [
            [-100, -70],
            [-100, 70],
            [100, 70],
            [100, -70],
            [-100, -70],
          ]),
        ],
        obstacles: [],
      };
    default:
      throw new Error("Unknown scenario");
  }
}
