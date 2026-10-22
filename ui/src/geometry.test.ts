/** @file Jason Stys: independent route/grid/freshness oracles. Locations: docs/SOURCE_MAP.md. */
import { describe, expect, it } from "vitest";
import { project, routeLength, freshness } from "./geometry";
describe("local training geometry", () => {
  it("keeps east right and north up with a fixed 50 m grid", () => {
    expect(project(0, 0)).toEqual([300, 300]);
    expect(project(50, 50)).toEqual([390, 210]);
    expect(() => project(NaN, 1)).toThrow();
    expect(() => project(1, Infinity)).toThrow();
  });
  it("includes independent departure/return distance", () => {
    expect(routeLength([])).toBe(0);
    expect(routeLength([{ east_m: 3, north_m: 4, altitude_m: 10 }])).toBe(10);
    expect(() =>
      routeLength([{ east_m: NaN, north_m: 0, altitude_m: 10 }]),
    ).toThrow();
  });
  it("marks missing, stale and future arrivals without rounding away the boundary", () => {
    expect(freshness(undefined, 100)).toBe("No observation");
    expect(freshness(NaN, 100)).toBe("No observation");
    expect(freshness(100, 100)).toBe("Fresh observation");
    expect(freshness(95, 100)).toBe("Fresh observation");
    expect(freshness(94.99, 100)).toBe("Stale / unknown");
    expect(freshness(102, 100)).toBe("Stale / unknown");
  });
});
