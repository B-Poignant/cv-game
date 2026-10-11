import { describe, expect, it } from "vitest";

import { BUILDINGS } from "../../../shared/buildings";
import {
  districtAt,
  districtCorners,
  districtLabelPosition,
  DISTRICTS,
} from "../../../shared/districts";
import {
  CHEST_POSITION,
  createWorldCollisions,
  DEV_SPAWN,
  isInsideMap,
  isWalkable,
  PLAYER_SPAWN,
} from "../../../shared/world";

// F-005
describe("DISTRICTS config", () => {
  it("gives every building's CV section one district", () => {
    const sections = DISTRICTS.map((district) => district.section);

    expect([...sections].sort()).toEqual(
      BUILDINGS.map((building) => building.section).sort(),
    );
  });

  it.each(BUILDINGS)("puts $title inside its own district", (building) => {
    const { column, row } = building.gridPosition;
    const corners = [
      { column, row },
      { column: column + building.width - 1, row: row + building.height - 1 },
    ];

    for (const corner of corners) {
      expect(districtAt(corner)?.section).toBe(building.section);
    }
  });

  it.each(DISTRICTS)("$name fits inside the map", (district) => {
    const { column, row } = district.gridPosition;

    expect(isInsideMap({ column, row })).toBe(true);
    expect(
      isInsideMap({
        column: column + district.width - 1,
        row: row + district.height - 1,
      }),
    ).toBe(true);
  });

  it("has no overlapping districts", () => {
    const owners = new Map<string, string>();

    for (const district of DISTRICTS) {
      for (let row = 0; row < district.height; row += 1) {
        for (let column = 0; column < district.width; column += 1) {
          const tile = `${district.gridPosition.column + column},${district.gridPosition.row + row}`;

          expect(owners.get(tile), tile).toBeUndefined();
          owners.set(tile, district.name);
        }
      }
    }
  });

  it("has unique names", () => {
    const names = DISTRICTS.map((district) => district.name);

    expect(new Set(names).size).toBe(names.length);
  });

  // Recruiters arrive at the crossroads; Ben and the chest are in the quarter left for the
  // Projects Lab.
  it("spawns recruiters at the crossroads, and keeps Ben and the chest outside the districts", () => {
    expect(districtAt(PLAYER_SPAWN)).toBeUndefined();
    expect(districtAt(DEV_SPAWN)).toBeUndefined();
    expect(districtAt(CHEST_POSITION)).toBeUndefined();
  });

  it.each(DISTRICTS)(
    "paints the $name label on a walkable tile of its district",
    (district) => {
      const position = districtLabelPosition(district);

      expect(districtAt(position)).toBe(district);
      expect(isWalkable(position, createWorldCollisions())).toBe(true);
    },
  );
});

describe("districtAt", () => {
  it.each([
    { column: 0, row: 0, name: "Skills Park" },
    { column: 11, row: 11, name: "Skills Park" },
    { column: 12, row: 0, name: "Experience Avenue" },
    { column: 23, row: 11, name: "Experience Avenue" },
    { column: 0, row: 12, name: "Education Campus" },
    { column: 11.4, row: 23.4, name: "Education Campus" },
    // Positions round to the nearest tile.
    { column: 11.5, row: 11, name: "Experience Avenue" },
  ])("finds $name at ($column, $row)", ({ name, ...position }) => {
    expect(districtAt(position)?.name).toBe(name);
  });

  it.each([
    { column: 12, row: 12 },
    { column: 11.6, row: 12.4 },
    { column: 23, row: 23 },
    { column: -1, row: 0 },
  ])("finds nothing at ($column, $row)", (position) => {
    expect(districtAt(position)).toBeUndefined();
  });
});

describe("districtCorners", () => {
  it("follows the tile edges around the area", () => {
    expect(
      districtCorners({
        name: "Test",
        section: "skills",
        gridPosition: { column: 2, row: 3 },
        width: 4,
        height: 5,
      }),
    ).toEqual([
      { column: 1.5, row: 2.5 },
      { column: 5.5, row: 2.5 },
      { column: 5.5, row: 7.5 },
      { column: 1.5, row: 7.5 },
    ]);
  });
});
