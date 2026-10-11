import { describe, expect, it } from "vitest";

import { BUILDINGS } from "../../../shared/buildings";
import {
  createWorldCollisions,
  DEV_SPAWN,
  DEV_SPEED,
  DEV_SPRINT,
  isInsideMap,
  isWalkable,
  MAP_SIZE,
  PLAYER_SPAWN,
  PLAYER_SPEED,
} from "../../../shared/world";
import { aBuildingDefinition } from "../../helpers/builders";

describe("world rules (shared by client and server)", () => {
  it("is a 24×24 map", () => {
    expect(MAP_SIZE).toEqual({ columns: 24, rows: 24 });
  });

  it("spawns recruiters on a walkable tile", () => {
    expect(isWalkable(PLAYER_SPAWN, createWorldCollisions())).toBe(true);
  });

  // F-060
  it("spawns the dev on a walkable tile, away from the recruiters", () => {
    expect(isWalkable(DEV_SPAWN, createWorldCollisions())).toBe(true);
    expect(DEV_SPAWN).not.toEqual(PLAYER_SPAWN);
  });

  // F-060: recruiters catch him by cornering him, so he must be slower.
  it("makes the dev slower than recruiters", () => {
    expect(DEV_SPEED).toBeLessThan(PLAYER_SPEED);
  });

  // F-061: a straight chase in the open must never close the gap, so cornering matters.
  it("lets the dev sprint faster than recruiters, often enough to keep his lead", () => {
    const gained = (DEV_SPRINT.speed - PLAYER_SPEED) * DEV_SPRINT.seconds;
    const lost = (PLAYER_SPEED - DEV_SPEED) * DEV_SPRINT.cooldownSeconds;

    expect(DEV_SPRINT.speed).toBeGreaterThan(PLAYER_SPEED);
    expect(gained).toBeGreaterThanOrEqual(lost);
  });

  describe("isInsideMap", () => {
    // Tiles are centred on whole numbers: tile 0 covers -0.5 to 0.5, tile 23 up to 23.5.
    it.each([
      { column: 0, row: 0 },
      { column: 23, row: 23 },
      { column: 10.5, row: 3.2 },
      { column: -0.5, row: 0 },
      { column: 0, row: -0.49 },
      { column: 23.49, row: 23.49 },
    ])("accepts ($column, $row)", (position) => {
      expect(isInsideMap(position)).toBe(true);
    });

    it.each([
      { column: -0.51, row: 0 },
      { column: 0, row: -1 },
      { column: 23.5, row: 0 },
      { column: 0, row: 23.5 },
      { column: 23.9, row: 0 },
      { column: 24, row: 0 },
    ])("rejects ($column, $row)", (position) => {
      expect(isInsideMap(position)).toBe(false);
    });
  });

  describe("createWorldCollisions", () => {
    it.each(BUILDINGS)("blocks every tile of $title", (building) => {
      const collisions = createWorldCollisions();
      const { column, row } = building.gridPosition;

      for (let dy = 0; dy < building.height; dy += 1) {
        for (let dx = 0; dx < building.width; dx += 1) {
          expect(
            collisions.isBlocked({ column: column + dx, row: row + dy }),
          ).toBe(true);
        }
      }
    });

    it("blocks nothing around a building", () => {
      const collisions = createWorldCollisions([
        aBuildingDefinition({
          gridPosition: { column: 5, row: 5 },
          width: 2,
          height: 1,
        }),
      ]);

      expect(collisions.isBlocked({ column: 4, row: 5 })).toBe(false);
      expect(collisions.isBlocked({ column: 7, row: 5 })).toBe(false);
      expect(collisions.isBlocked({ column: 5, row: 6 })).toBe(false);
    });
  });

  describe("isWalkable", () => {
    const collisions = createWorldCollisions();
    const [experience] = BUILDINGS;

    it("accepts a free tile", () => {
      expect(isWalkable({ column: 1, row: 1 }, collisions)).toBe(true);
    });

    it("rejects a building tile", () => {
      expect(isWalkable(experience.gridPosition, collisions)).toBe(false);
    });

    it("rejects a position that rounds onto a building", () => {
      const { column, row } = experience.gridPosition;

      expect(isWalkable({ column: column - 0.4, row }, collisions)).toBe(false);
    });

    it("rejects a position outside the map", () => {
      expect(isWalkable({ column: -1, row: 1 }, collisions)).toBe(false);
    });
  });
});
