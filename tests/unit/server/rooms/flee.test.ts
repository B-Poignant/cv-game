import { describe, expect, it } from "vitest";

import { fleeStep, threatsWithin } from "../../../../server/rooms/flee";
import { CollisionMap } from "../../../../shared/CollisionMap";
import { isWalkable } from "../../../../shared/world";

const STEP = 0.2;
const open = new CollisionMap();

// F-061
describe("threatsWithin", () => {
  it("keeps only the recruiters closer than the radius", () => {
    const near = { column: 7, row: 5 };
    const far = { column: 15, row: 5 };

    expect(threatsWithin({ column: 5, row: 5 }, [near, far], 4)).toEqual([
      near,
    ]);
  });
});

// F-061
describe("fleeStep", () => {
  it("does nothing without threats", () => {
    expect(fleeStep({ column: 5, row: 5 }, [], STEP, open)).toBeUndefined();
  });

  it("runs straight away from a single recruiter in the open", () => {
    const next = fleeStep(
      { column: 10, row: 10 },
      [{ column: 8, row: 10 }],
      STEP,
      open,
    );

    expect(next?.column).toBeCloseTo(10 + STEP);
    expect(next?.row).toBeCloseTo(10);
  });

  it("slips out sideways between two recruiters closing in from both sides", () => {
    const next = fleeStep(
      { column: 10, row: 10 },
      [
        { column: 8, row: 10 },
        { column: 12, row: 10 },
      ],
      STEP,
      open,
    );

    expect(next?.column).toBeCloseTo(10);
    expect(Math.abs((next?.row ?? 10) - 10)).toBeCloseTo(STEP);
  });

  it("runs from the closest recruiter first", () => {
    const next = fleeStep(
      { column: 10, row: 10 },
      [
        { column: 9, row: 10 }, // 1 tile to his left
        { column: 10, row: 13 }, // 3 tiles below
      ],
      STEP,
      open,
    );

    expect(next?.column).toBeGreaterThan(10);
  });

  it("slides along the map edge instead of running off it", () => {
    // Pushed towards column 0, with the recruiter slightly below him.
    const next = fleeStep(
      { column: 0, row: 10 },
      [{ column: 2, row: 10.5 }],
      STEP,
      open,
    );

    expect(next).toBeDefined();
    expect(isWalkable(next!, open)).toBe(true);
    expect(next!.row).toBeLessThan(10);
  });

  it("never steps onto a building", () => {
    const walls = new CollisionMap();
    walls.blockArea(11, 8, 1, 5); // a wall right behind him

    const next = fleeStep(
      { column: 10.4, row: 10 },
      [{ column: 9, row: 10 }],
      STEP,
      walls,
    );

    expect(next).toBeDefined();
    expect(isWalkable(next!, walls)).toBe(true);
  });

  it("stays put when cornered: no step gets him further away", () => {
    // The map's corner: tile (0, 0) starts at -0.5.
    const next = fleeStep(
      { column: -0.5, row: -0.5 },
      [{ column: 0.3, row: 0.3 }],
      STEP,
      open,
    );

    expect(next).toBeUndefined();
  });
});
