/** @file Jason Stys: independent geometry, obstacle, clock, projection and cooperative scenario oracles. Locations: docs/SOURCE_MAP.md. */
import { describe, expect, it } from "vitest";
import {
  clearSegment,
  distance,
  frameAt,
  pathLength,
  planPath,
  positionAt,
  prepare,
  scenario,
  segmentDistance,
  sweptSeparation,
  type XY,
} from "./rehearsal";

/** Sample each segment independently of the planner's distance function. */
function assertClear(
  path: XY[],
  obstacles: { east: number; north: number; radius: number }[],
) {
  for (let i = 1; i < path.length; i++)
    for (let fraction = 0; fraction <= 100; fraction++) {
      const a = path[i - 1]!;
      const b = path[i]!;
      const f = fraction / 100;
      const x = a.east + (b.east - a.east) * f;
      const y = a.north + (b.north - a.north) * f;
      expect(Math.abs(x)).toBeLessThanOrEqual(120);
      expect(Math.abs(y)).toBeLessThanOrEqual(120);
      for (const disk of obstacles)
        expect(
          Math.sqrt((x - disk.east) ** 2 + (y - disk.north) ** 2),
        ).toBeGreaterThan(disk.radius + 3 - 1e-8);
    }
}

describe("geometry contracts", () => {
  it("uses meters, clamps segment endpoints, and handles stationary segments", () => {
    expect(distance({ east: 0, north: 0 }, { east: 3, north: 4 })).toBe(5);
    const a = { east: 0, north: 0 };
    const b = { east: 10, north: 0 };
    expect(segmentDistance({ east: 5, north: 3 }, a, b)).toBe(3);
    expect(segmentDistance({ east: -4, north: 3 }, a, b)).toBe(5);
    expect(segmentDistance({ east: 14, north: 3 }, a, b)).toBe(5);
    expect(segmentDistance({ east: 3, north: 4 }, a, a)).toBe(5);
    expect(
      sweptSeparation(a, b, { east: 5, north: -5 }, { east: 5, north: 5 }),
    ).toBe(0);
    expect(clearSegment(a, b, [{ east: 5, north: 4, radius: 1 }])).toBe(false);
  });
  it("interpolates speed and holds at the endpoint including duplicate waypoints", () => {
    const path = [
      { east: 0, north: 0 },
      { east: 0, north: 0 },
      { east: 30, north: 40 },
    ];
    expect(pathLength(path)).toBe(50);
    expect(positionAt(path, 5, 5)).toEqual({ east: 15, north: 20 });
    expect(positionAt(path, 5, 100)).toEqual({ east: 30, north: 40 });
    for (const [speed, time] of [
      [0, 1],
      [5, -1],
      [NaN, 0],
      [5, Infinity],
    ])
      expect(() => positionAt(path, speed!, time!)).toThrow();
    expect(() => positionAt([], 5, 0)).toThrow();
  });
});

describe("bounded A* obstacle planning", () => {
  it("takes the exact unobstructed straight path and does not mutate inputs", () => {
    const start = { east: -13.2, north: 9.1 };
    const goal = { east: 30.4, north: -10 };
    expect(planPath(start, goal, [])).toEqual([start, goal]);
    expect(planPath(start, start, [])).toEqual([start, start]);
    expect(start.east).toBe(-13.2);
  });
  it("finds a longer detour with exact endpoints and no swept obstacle penetration", () => {
    for (const offset of [0, 1.2, -8.5]) {
      const start = { east: -100 + offset, north: 0.8 };
      const goal = { east: 100, north: -0.8 };
      const obstacles = [
        { east: 0, north: 0, radius: 24 },
        { east: 45, north: 38, radius: 8 },
      ];
      const path = planPath(start, goal, obstacles)!;
      expect(path[0]).toEqual(start);
      expect(path.at(-1)).toEqual(goal);
      expect(pathLength(path)).toBeGreaterThan(distance(start, goal));
      assertClear(path, obstacles);
    }
  });
  it("rejects unsafe endpoints, full barriers and invalid budgets instead of guessing", () => {
    const a = { east: -100, north: 0 };
    const b = { east: 100, north: 0 };
    expect(planPath(a, b, [{ ...a, radius: 2 }])).toBeNull();
    expect(planPath(a, b, [{ ...b, radius: 2 }])).toBeNull();
    expect(prepare(scenario("blocked")).blocked).toBe(true);
    for (const bad of [
      { east: NaN, north: 0 },
      { east: 121, north: 0 },
      { east: 0, north: Infinity },
    ])
      expect(() => planPath(bad, b, [])).toThrow();
    for (const radius of [0, 36, NaN])
      expect(() => planPath(a, b, [{ east: 0, north: 0, radius }])).toThrow();
    expect(() =>
      planPath(
        a,
        b,
        Array.from({ length: 9 }, () => ({ east: 0, north: 0, radius: 1 })),
      ),
    ).toThrow();
  });
});

describe("independent realistic training scenarios", () => {
  it("distinguishes a time-limited exercise from actual route completion", () => {
    const exercise = scenario("survey");
    exercise.routes[0]!.speed = 1;
    const prepared = prepare(exercise);
    expect(prepared.duration).toBe(180);
    const frame = frameAt(prepared, 200);
    expect(frame.phase).toContain("time limit");
    expect(frame.aircraft[0]!.speed).toBe(0);
    expect(frame.aircraft[0]!.point).not.toEqual(
      exercise.routes[0]!.points.at(-1),
    );
  });
  it("completes the perimeter in 136 s and projects 10 s at constant speed", () => {
    const exercise = prepare(scenario("survey"));
    expect(exercise.duration).toBe(136);
    const frame = frameAt(exercise, 10);
    expect(frame.aircraft[0]!.point).toEqual({ east: -100, north: -20 });
    expect(frame.aircraft[0]!.projected.at(-1)).toEqual({
      east: -100,
      north: 30,
    });
    expect(frame.aircraft[0]!.speed).toBe(5);
    expect(frameAt(exercise, 1000).aircraft[0]!.point).toEqual({
      east: -100,
      north: -70,
    });
    expect(frameAt(exercise, 136).phase).toContain("complete");
    expect(frameAt(exercise, 136).aircraft[0]!.speed).toBe(0);
  });
  it("completes a cooperative meeting 20 m apart without reacting to another aircraft", () => {
    const exercise = prepare(scenario("meeting"));
    expect(exercise.stop).toBe(exercise.duration);
    const result = frameAt(exercise, 180);
    expect(result.aircraft[0]!.point).toEqual({ east: 0, north: 0 });
    expect(result.aircraft[1]!.point).toEqual({ east: 0, north: 20 });
    expect(distance(result.aircraft[0]!.point, result.aircraft[1]!.point)).toBe(
      20,
    );
  });
  it("stops crossing traffic before separation loss and holds future projections too", () => {
    const exercise = prepare(scenario("crossing"));
    expect(exercise.stop).toBeGreaterThan(18);
    expect(exercise.stop).toBeLessThan(20);
    const stopped = frameAt(exercise, 100);
    expect(stopped.phase).toContain("Separation hold");
    expect(
      distance(stopped.aircraft[0]!.point, stopped.aircraft[1]!.point),
    ).toBeGreaterThanOrEqual(8);
    for (const aircraft of stopped.aircraft)
      expect(
        aircraft.projected.every((p) => distance(p, aircraft.point) === 0),
      ).toBe(true);
    for (let t = 0; t <= exercise.stop; t += 0.013) {
      const f = frameAt(exercise, t);
      expect(
        distance(f.aircraft[0]!.point, f.aircraft[1]!.point),
      ).toBeGreaterThanOrEqual(8);
    }
  });
  it("holds every vehicle if any route is blocked and rejects invalid scenes/clocks", () => {
    const blocked = prepare(scenario("blocked"));
    const frame = frameAt(blocked, 30);
    expect(frame.phase).toContain("unavailable");
    expect(frame.time).toBe(0);
    expect(frame.aircraft[0]!.projected).toEqual([
      blocked.routes[0]!.points[0],
    ]);
    expect(frame.aircraft[0]!.speed).toBe(0);
    const ordinary = scenario("detour");
    for (const time of [-1, Infinity, NaN])
      expect(() => frameAt(prepare(ordinary), time)).toThrow();
    expect(() => scenario("unknown")).toThrow();
    expect(() => prepare({ ...ordinary, routes: [] })).toThrow();
    expect(() =>
      prepare({ ...ordinary, routes: [{ ...ordinary.routes[0]!, speed: 9 }] }),
    ).toThrow();
    expect(() =>
      prepare({
        ...ordinary,
        routes: [{ ...ordinary.routes[0]!, points: [] }],
      }),
    ).toThrow();
  });
});
