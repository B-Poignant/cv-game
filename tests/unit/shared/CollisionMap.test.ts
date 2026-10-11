import { describe, expect, it } from "vitest";

import { CollisionMap } from "../../../shared/CollisionMap";

describe("../../../shared/CollisionMap", () => {
  it("considers a tile walkable by default", () => {
    const collisions = new CollisionMap();

    expect(collisions.isBlocked({ column: 3, row: 4 })).toBe(false);
  });

  it("blocks a specific tile only", () => {
    const collisions = new CollisionMap();

    collisions.block(3, 4);

    expect(collisions.isBlocked({ column: 3, row: 4 })).toBe(true);
    expect(collisions.isBlocked({ column: 3, row: 5 })).toBe(false);
  });

  describe("blockArea", () => {
    // Area starting at (3, 4), 2 columns wide and 3 rows tall.
    const collisions = new CollisionMap();
    collisions.blockArea(3, 4, 2, 3);

    it.each([
      { column: 3, row: 4, corner: "top-left" },
      { column: 4, row: 4, corner: "top-right" },
      { column: 3, row: 6, corner: "bottom-left" },
      { column: 4, row: 6, corner: "bottom-right" },
    ])("blocks the $corner corner ($column, $row)", ({ column, row }) => {
      expect(collisions.isBlocked({ column, row })).toBe(true);
    });

    it.each([
      { column: 2, row: 4, side: "left of" },
      { column: 5, row: 4, side: "right of" },
      { column: 3, row: 3, side: "above" },
      { column: 3, row: 7, side: "below" },
    ])("leaves the tile $side the area free", ({ column, row }) => {
      expect(collisions.isBlocked({ column, row })).toBe(false);
    });

    it("blocks nothing for an empty area", () => {
      const empty = new CollisionMap();

      empty.blockArea(3, 4, 0, 0);

      expect(empty.isBlocked({ column: 3, row: 4 })).toBe(false);
    });
  });

  describe("with fractional positions (continuous movement)", () => {
    const collisions = new CollisionMap();
    collisions.block(5, 5);

    it.each([
      { column: 4.6, row: 5 },
      { column: 5.4, row: 5.4 },
    ])("treats ($column, $row) as the nearest tile (5, 5)", (position) => {
      expect(collisions.isBlocked(position)).toBe(true);
    });

    it("treats a position closer to a neighbour as that neighbour", () => {
      expect(collisions.isBlocked({ column: 4.4, row: 5 })).toBe(false);
    });
  });
});
