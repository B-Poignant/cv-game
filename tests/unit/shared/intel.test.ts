import { describe, expect, it } from "vitest";

import { BUILDINGS } from "../../../shared/buildings";
import {
  distanceToSource,
  INTEL_CARDS,
  INTEL_NEEDED_TO_PITCH,
  intelCardFrom,
  isIntelCardId,
  isIntelSource,
  isWithinIntelReach,
} from "../../../shared/intel";
import {
  CHEST_POSITION,
  createWorldCollisions,
  isWalkable,
  MAP_SIZE,
} from "../../../shared/world";

// F-031
describe("intel cards", () => {
  it("has one card per source, and enough sources to pitch", () => {
    const sources = INTEL_CARDS.map((card) => card.source);

    expect(new Set(sources).size).toBe(sources.length);
    expect(INTEL_CARDS.length).toBeGreaterThanOrEqual(INTEL_NEEDED_TO_PITCH);
  });

  it("only uses buildings that exist on the map, plus the chest", () => {
    const sections: string[] = BUILDINGS.map((building) => building.section);

    for (const { source } of INTEL_CARDS) {
      expect([...sections, "chest"]).toContain(source);
    }
  });

  it("tells sources and card ids apart from anything else", () => {
    expect(isIntelSource("skills")).toBe(true);
    expect(isIntelSource("chest")).toBe(true);
    expect(isIntelSource("stack")).toBe(false);
    expect(isIntelSource(undefined)).toBe(false);

    expect(isIntelCardId("lead")).toBe(true);
    expect(isIntelCardId("skills")).toBe(false);
    expect(isIntelCardId(42)).toBe(false);
  });

  it("finds the card each source gives", () => {
    expect(intelCardFrom("skills")).toBe("stack");
    expect(intelCardFrom("experience")).toBe("lead");
    expect(intelCardFrom("education")).toBe("education");
    expect(intelCardFrom("chest")).toBe("work-mode");
  });

  describe("reach", () => {
    // EXPERIENCE covers columns 16–18, rows 5–6.
    it.each([
      { column: 15, row: 5, distance: 1, label: "next to a wall" },
      { column: 17, row: 8, distance: 2, label: "two tiles below" },
      { column: 20, row: 8, distance: Math.hypot(2, 2), label: "off a corner" },
      { column: 13, row: 5, distance: 3, label: "three tiles left" },
    ])(
      "measures $label to the nearest building tile",
      ({ distance, ...position }) => {
        expect(distanceToSource(position, "experience")).toBeCloseTo(distance);
      },
    );

    it("measures to the chest tile", () => {
      expect(distanceToSource(CHEST_POSITION, "chest")).toBe(0);
      expect(distanceToSource({ column: 19, row: 20 }, "chest")).toBeCloseTo(
        Math.hypot(2, 1),
      );
    });

    it("reaches up to 2 tiles, not further", () => {
      expect(isWithinIntelReach({ column: 17, row: 8 }, "experience")).toBe(
        true,
      );
      expect(isWithinIntelReach({ column: 17, row: 8.1 }, "experience")).toBe(
        false,
      );
    });

    it("can be reached from a walkable tile for every source", () => {
      const collisions = createWorldCollisions();

      for (const { source } of INTEL_CARDS) {
        const reachable = Array.from(
          { length: MAP_SIZE.columns * MAP_SIZE.rows },
          (_, index) => ({
            column: index % MAP_SIZE.columns,
            row: Math.floor(index / MAP_SIZE.columns),
          }),
        ).some(
          (tile) =>
            isWalkable(tile, collisions) && isWithinIntelReach(tile, source),
        );

        expect(reachable, source).toBe(true);
      }
    });
  });
});
