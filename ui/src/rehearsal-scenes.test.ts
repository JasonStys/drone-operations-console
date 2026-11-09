/** @file Jason Stys: independent scene safety/interchange contracts. Exact lines: docs/SOURCE_MAP.md. */
import { describe, expect, it } from "vitest";
import { frameAt, prepare, scenario } from "./rehearsal";
import {
  MAX_SCENE_BYTES,
  parseScene,
  sceneDocument,
  readSceneFile,
} from "./rehearsal-scenes";

/** A 100 m straight fictional inspection takes 20 seconds at 5 m/s. */
function simple() {
  return {
    schema: 1,
    simulation_only: true,
    name: "Warehouse walk-through",
    description: "Synthetic aisle inspection",
    routes: [
      {
        id: "inspector",
        name: "Inspector",
        speed: 5,
        points: [
          { east: -50, north: 0 },
          { east: 50, north: 0 },
        ],
      },
    ],
    obstacles: [],
  };
}

describe("reusable cooperative scenes", () => {
  it("reads actual bounded UTF-8 bytes and rejects changed sizes and damaged encoding", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(simple())).buffer;
    await expect(
      readSceneFile({ size: bytes.byteLength, arrayBuffer: async () => bytes }),
    ).resolves.toEqual(parseScene(JSON.stringify(simple())));
    await expect(
      readSceneFile({ size: 0, arrayBuffer: async () => bytes }),
    ).rejects.toThrow(/nonempty/);
    await expect(
      readSceneFile({ size: 32769, arrayBuffer: async () => bytes }),
    ).rejects.toThrow(/32 KiB/);
    await expect(
      readSceneFile({ size: 2, arrayBuffer: async () => bytes }),
    ).rejects.toThrow(/changed/);
    await expect(
      readSceneFile({
        size: 2,
        arrayBuffer: async () => new Uint8Array([255, 254]).buffer,
      }),
    ).rejects.toThrow(/UTF-8/);
  });
  it("round trips every fixed scene, including cooperative names with spaces", () => {
    for (const name of ["detour", "meeting", "crossing", "blocked", "survey"])
      expect(parseScene(sceneDocument(scenario(name)))).toEqual(scenario(name));
  });
  it("replays deterministically and exports only inputs", () => {
    const imported = parseScene(JSON.stringify(simple()));
    const exercise = prepare(imported);
    expect(exercise.duration).toBe(20);
    expect(frameAt(exercise, 7).aircraft[0]!.point).toEqual({
      east: -15,
      north: 0,
    });
    expect(frameAt(exercise, 3).aircraft[0]!.point).toEqual({
      east: -35,
      north: 0,
    });
    expect(frameAt(exercise, 7)).toEqual(
      frameAt(prepare(parseScene(sceneDocument(imported))), 7),
    );
    expect(Object.keys(JSON.parse(sceneDocument(imported))).sort()).toEqual([
      "description",
      "name",
      "obstacles",
      "routes",
      "schema",
      "simulation_only",
    ]);
  });
  it("rejects unsafe initial separation and obstacle overlap before any animation", () => {
    const data = simple();
    data.routes.push({ ...data.routes[0]!, id: "other" });
    expect(() => parseScene(JSON.stringify(data))).toThrow(/separation/);
    const obstacle = {
      ...simple(),
      obstacles: [{ east: -50, north: 0, radius: 1 }],
    };
    expect(() => parseScene(JSON.stringify(obstacle))).toThrow(
      /starting point/,
    );
    data.routes[1]!.points = [
      { east: -50, north: 20 },
      { east: 50, north: 20 },
    ];
    expect(prepare(parseScene(JSON.stringify(data))).stop).toBe(20);
  });
  it.each([
    null,
    [],
    true,
    {},
    { ...simple(), schema: 2 },
    { ...simple(), simulation_only: false },
    { ...simple(), live_aircraft: true },
    { ...simple(), name: " " },
    { ...simple(), name: "x".repeat(81) },
    { ...simple(), description: "\u0000control" },
    { ...simple(), description: "x".repeat(401) },
    { ...simple(), routes: [] },
    { ...simple(), routes: "routes" },
    { ...simple(), routes: Array(4).fill(simple().routes[0]) },
    { ...simple(), obstacles: {} },
    { ...simple(), obstacles: Array(9).fill({ east: 0, north: 0, radius: 1 }) },
    { ...simple(), obstacles: [{ east: 0, north: 0, radius: "2" }] },
    { ...simple(), obstacles: [{ east: 0, north: 0, radius: 36 }] },
    { ...simple(), routes: [{ ...simple().routes[0], id: "bad<script>" }] },
    { ...simple(), routes: [{ ...simple().routes[0], speed: "5" }] },
    { ...simple(), routes: [{ ...simple().routes[0], speed: 0 }] },
    {
      ...simple(),
      routes: [{ ...simple().routes[0], points: [{ east: -50, north: 0 }] }],
    },
    {
      ...simple(),
      routes: [
        { ...simple().routes[0], points: Array(9).fill({ east: 0, north: 0 }) },
      ],
    },
    { ...simple(), routes: [{ ...simple().routes[0], points: [null, null] }] },
    {
      ...simple(),
      routes: [
        {
          ...simple().routes[0],
          points: [
            { east: true, north: 0 },
            { east: 50, north: 0 },
          ],
        },
      ],
    },
    {
      ...simple(),
      routes: [
        {
          ...simple().routes[0],
          points: [
            { east: 121, north: 0 },
            { east: 50, north: 0 },
          ],
        },
      ],
    },
    {
      ...simple(),
      routes: [
        {
          ...simple().routes[0],
          points: [
            { east: -50, north: 0, altitude: 0 },
            { east: 50, north: 0 },
          ],
        },
      ],
    },
    {
      ...simple(),
      routes: [
        simple().routes[0],
        {
          ...simple().routes[0],
          points: [
            { east: -50, north: 20 },
            { east: 50, north: 20 },
          ],
        },
      ],
    },
  ])("fails closed for unsupported scene data %#", (data) => {
    expect(() => parseScene(JSON.stringify(data))).toThrow();
  });
  it("bounds bytes and rejects malformed JSON without changing an existing scene", () => {
    expect(() => parseScene(" ".repeat(MAX_SCENE_BYTES + 1))).toThrow(/32 KiB/);
    expect(() => parseScene("é".repeat(MAX_SCENE_BYTES / 2 + 1))).toThrow(
      /32 KiB/,
    );
    expect(() => parseScene('{"schema":')).toThrow();
    expect(() =>
      parseScene(
        sceneDocument(scenario("survey")).replace(
          '"speed": 5',
          '"speed": 1e999',
        ),
      ),
    ).toThrow();
  });
});
