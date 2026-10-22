/** @file Jason Stys: bounded local-grid projection and route metrics. Variables/functions: docs/SOURCE_MAP.md. */
export type Point = { east_m: number; north_m: number; altitude_m: number };

/** Project meters into a fixed 600-unit SVG. Values outside the grid are clipped, not hidden as safe. */
export function project(east: number, north: number): [number, number] {
  if (!Number.isFinite(east) || !Number.isFinite(north))
    throw new Error("Invalid coordinate");
  return [300 + east * 1.8, 300 - north * 1.8];
}

/** Include departure and return in the horizontal route metric; altitude changes are separate. */
export function routeLength(points: Point[]): number {
  let total = 0;
  let east = 0;
  let north = 0;
  for (const point of [...points, { east_m: 0, north_m: 0, altitude_m: 0 }]) {
    if (![point.east_m, point.north_m, point.altitude_m].every(Number.isFinite))
      throw new Error("Non-finite waypoint");
    total += Math.hypot(point.east_m - east, point.north_m - north);
    east = point.east_m;
    north = point.north_m;
  }
  return total;
}

/** Classify arrival freshness without confusing zero elapsed time with missing data. */
export function freshness(
  received: number | undefined,
  now = Date.now() / 1000,
): string {
  if (received === undefined || !Number.isFinite(received))
    return "No observation";
  const age = now - received;
  return age < -1 || age > 5 ? "Stale / unknown" : "Fresh observation";
}
