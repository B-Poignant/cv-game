import { describe, expect, it } from "vitest";

import { BUILDINGS, type BuildingDefinition } from "../../../shared/buildings";
import type { GridPosition } from "../../../shared/grid";
import { MAP_SIZE, PLAYER_SPAWN } from "../../../shared/world";

function tilesOf(building: BuildingDefinition): GridPosition[] {
  const tiles: GridPosition[] = [];

  for (let row = 0; row < building.height; row += 1) {
    for (let column = 0; column < building.width; column += 1) {
      tiles.push({
        column: building.gridPosition.column + column,
        row: building.gridPosition.row + row,
      });
    }
  }

  return tiles;
}

function covers(building: BuildingDefinition, tile: GridPosition): boolean {
  return tilesOf(building).some(
    ({ column, row }) => column === tile.column && row === tile.row,
  );
}

// Content checks: catch a layout typo before it ships.
describe("BUILDINGS config", () => {
  it("gives each CV section to exactly one building", () => {
    const sections = BUILDINGS.map((building) => building.section);

    expect([...sections].sort()).toEqual(["education", "experience", "skills"]);
  });

  it("has unique titles", () => {
    const titles = BUILDINGS.map((building) => building.title);

    expect(new Set(titles).size).toBe(titles.length);
  });

  it.each(BUILDINGS)("$title fits inside the map", (building) => {
    for (const { column, row } of tilesOf(building)) {
      expect(column).toBeGreaterThanOrEqual(0);
      expect(column).toBeLessThan(MAP_SIZE.columns);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(MAP_SIZE.rows);
    }
  });

  it.each(BUILDINGS)("$title does not cover the player spawn", (building) => {
    expect(covers(building, PLAYER_SPAWN)).toBe(false);
  });

  it("has no overlapping buildings", () => {
    BUILDINGS.forEach((building, index) => {
      for (const other of BUILDINGS.slice(index + 1)) {
        const overlaps = tilesOf(building).some((tile) => covers(other, tile));

        expect(overlaps, `${building.title} overlaps ${other.title}`).toBe(
          false,
        );
      }
    });
  });
});
