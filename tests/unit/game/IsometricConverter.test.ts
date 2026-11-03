import { describe, expect, it } from "vitest";

import { IsometricConverter } from "../../../src/game/IsometricConverter";

describe("IsometricConverter", () => {
  const converter = new IsometricConverter(64, 32);

  it.each([
    { column: 0, row: 0, x: 0, y: 0, label: "origin" },
    { column: 1, row: 0, x: 32, y: 16, label: "one column right" },
    { column: 0, row: 1, x: -32, y: 16, label: "one row down" },
    { column: 1, row: 1, x: 0, y: 32, label: "diagonal" },
    { column: 5, row: 3, x: 64, y: 128, label: "arbitrary tile" },
    { column: 0.5, row: 0, x: 16, y: 8, label: "half a tile" },
  ])("maps ($column, $row) to ($x, $y): $label", ({ column, row, x, y }) => {
    expect(converter.toScreen({ column, row })).toEqual({ x, y });
  });

  it("gives the screen angle of the column axis, for text that lies on the ground", () => {
    const step = converter.toScreen({ column: 1, row: 0 });

    expect(converter.columnAxisAngle).toBeCloseTo(Math.atan2(step.y, step.x));
    expect(new IsometricConverter(64, 64).columnAxisAngle).toBeCloseTo(
      Math.PI / 4,
    );
  });

  it("scales with the tile size", () => {
    const large = new IsometricConverter(128, 64);

    expect(large.toScreen({ column: 1, row: 0 })).toEqual({ x: 64, y: 32 });
  });
});
