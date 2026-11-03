// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { Graphics } from "pixi.js";

import { DEFAULT_THEME, THEMES } from "../../../src/config/themes";
import { CollisionMap } from "../../../shared/CollisionMap";
import { GameMap } from "../../../src/game/Map";
import { drawnColours } from "../../helpers/pixi";

describe("GameMap", () => {
  it("draws one tile per grid cell", () => {
    const map = new GameMap(4, 3);

    expect(map.children).toHaveLength(12);
  });

  describe("isInside", () => {
    const map = new GameMap(20, 20);

    // Tiles are centred on whole numbers: tile 0 covers -0.5 to 0.5, tile 19 up to 19.5.
    it.each([
      { column: 0, row: 0 },
      { column: 19, row: 19 },
      { column: 10.5, row: 3.2 },
      { column: -0.5, row: 0 },
      { column: 0, row: -0.49 },
      { column: 19.49, row: 19.49 },
    ])("accepts ($column, $row)", (position) => {
      expect(map.isInside(position)).toBe(true);
    });

    it.each([
      { column: -0.51, row: 0 },
      { column: 0, row: -1 },
      { column: 19.5, row: 0 },
      { column: 0, row: 19.5 },
      { column: 19.9, row: 0 },
      { column: 20, row: 0 },
    ])("rejects ($column, $row)", (position) => {
      expect(map.isInside(position)).toBe(false);
    });
  });

  describe("canWalkTo", () => {
    it("allows a free tile inside the map", () => {
      const map = new GameMap(20, 20);

      expect(map.canWalkTo({ column: 5, row: 5 })).toBe(true);
    });

    it("refuses a tile outside the map", () => {
      const map = new GameMap(20, 20);

      expect(map.canWalkTo({ column: -1, row: 5 })).toBe(false);
    });

    // The scene passes the world's collisions (createWorldCollisions), as the server uses.
    it("walks around the collision map it is given", () => {
      const collisions = new CollisionMap();
      collisions.block(3, 4);

      const map = new GameMap(20, 20, collisions);

      expect(map.canWalkTo({ column: 3, row: 4 })).toBe(false);
      expect(map.collisions).toBe(collisions);
    });

    it("refuses a tile covered by a blocked area", () => {
      const map = new GameMap(20, 20);

      map.blockArea(5, 5, 2, 2);

      expect(map.canWalkTo({ column: 6, row: 6 })).toBe(false);
      expect(map.canWalkTo({ column: 7, row: 6 })).toBe(true);
    });
  });

  it("reports its size in pixels", () => {
    const map = new GameMap(20, 10);

    expect(map.getWidth()).toBe(30 * 32);
    expect(map.getHeight()).toBe(30 * 16);
  });

  // F-050
  describe("themes", () => {
    const tiles = (map: GameMap) =>
      map.children.filter((child) => child instanceof Graphics);

    it("draws tiles with the default theme", () => {
      const map = new GameMap(2, 2);

      expect(map.theme).toBe(DEFAULT_THEME);
      expect(drawnColours(tiles(map)[0])).toEqual(DEFAULT_THEME.tile);
    });

    it.each(THEMES)("redraws every tile in the $name colours", (theme) => {
      const map = new GameMap(3, 2);

      map.applyTheme(theme);

      expect(map.theme).toBe(theme);
      for (const tile of tiles(map)) {
        expect(drawnColours(tile)).toEqual(theme.tile);
      }
    });

    it("recolours tiles without adding any", () => {
      const map = new GameMap(3, 2);

      map.applyTheme(THEMES[1]);
      map.applyTheme(THEMES[2]);

      expect(map.children).toHaveLength(6);
    });
  });
});
