// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { THEMES } from "../../../src/config/themes";
import { NameTag } from "../../../src/game/entities/NameTag";
import { GameMap } from "../../../src/game/Map";
import { Player, type PlayerMoveHandler } from "../../../src/game/Player";
import { MAP_SIZE, PLAYER_SPAWN } from "../../../shared/world";
import { pressKey, releaseKey } from "../../helpers/keyboard";

/** One frame at 60 fps, in seconds. */
const FRAME = 1 / 60;
/** Distance covered in one frame: 3 tiles per second at 60 fps. */
const STEP = 3 / 60;
const SPAWN = PLAYER_SPAWN;

function updateTimes(player: Player, frames: number): void {
  for (let frame = 0; frame < frames; frame += 1) {
    player.update(FRAME);
  }
}

describe("Player", () => {
  let map: GameMap;
  let onMove: Mock<PlayerMoveHandler>;
  let player: Player;

  beforeEach(() => {
    map = new GameMap(MAP_SIZE.columns, MAP_SIZE.rows);
    onMove = vi.fn<PlayerMoveHandler>();
    player = new Player(map, map.converter, onMove);
  });

  it("spawns at (5, 5)", () => {
    expect(player.getGridPosition()).toEqual(SPAWN);
  });

  it("is drawn at the screen position of its tile", () => {
    expect({ x: player.x, y: player.y }).toEqual(map.converter.toScreen(SPAWN));
  });

  it("stays still without input", () => {
    player.update(FRAME);

    expect(player.getGridPosition()).toEqual(SPAWN);
    expect(onMove).not.toHaveBeenCalled();
  });

  // Arrows plus both AZERTY (z/q/s/d) and QWERTY (w/a/s/d) layouts.
  it.each([
    { key: "ArrowUp", column: 0, row: -1 },
    { key: "z", column: 0, row: -1 },
    { key: "w", column: 0, row: -1 },
    { key: "ArrowDown", column: 0, row: 1 },
    { key: "s", column: 0, row: 1 },
    { key: "ArrowLeft", column: -1, row: 0 },
    { key: "q", column: -1, row: 0 },
    { key: "a", column: -1, row: 0 },
    { key: "ArrowRight", column: 1, row: 0 },
    { key: "d", column: 1, row: 0 },
  ])("moves one step on $key", ({ key, column, row }) => {
    pressKey(key);
    player.update(FRAME);

    const position = player.getGridPosition();
    expect(position.column).toBeCloseTo(SPAWN.column + column * STEP);
    expect(position.row).toBeCloseTo(SPAWN.row + row * STEP);
  });

  it("ignores key case (caps lock)", () => {
    pressKey("D");
    player.update(FRAME);

    expect(player.getGridPosition().column).toBeCloseTo(SPAWN.column + STEP);
  });

  it("moves at the same speed diagonally", () => {
    pressKey("ArrowRight");
    pressKey("ArrowDown");
    player.update(FRAME);

    const { column, row } = player.getGridPosition();
    const distance = Math.hypot(column - SPAWN.column, row - SPAWN.row);
    expect(distance).toBeCloseTo(STEP);
  });

  it("stops when the key is released", () => {
    pressKey("ArrowRight");
    player.update(FRAME);
    releaseKey("ArrowRight");
    const afterRelease = player.getGridPosition();

    player.update(FRAME);

    expect(player.getGridPosition()).toEqual(afterRelease);
  });

  it("cancels out opposite directions", () => {
    pressKey("ArrowLeft");
    pressKey("ArrowRight");
    player.update(FRAME);

    expect(player.getGridPosition()).toEqual(SPAWN);
  });

  it("reports each move with a copy of its position", () => {
    pressKey("ArrowRight");
    player.update(FRAME);

    expect(onMove).toHaveBeenCalledOnce();
    const reported = onMove.mock.calls[0][0];
    expect(reported).toEqual(player.getGridPosition());

    reported.column = 99;
    expect(player.getGridPosition().column).not.toBe(99);
  });

  it("cannot leave the map", () => {
    pressKey("ArrowLeft");
    updateTimes(player, (60 * (SPAWN.column + 1)) / 3);

    // Tile 0 starts at -0.5 (tiles are centred on whole numbers).
    expect(player.getGridPosition().column).toBeGreaterThanOrEqual(-0.5);
    expect(player.getGridPosition().column).toBeLessThan(-0.5 + STEP);
  });

  it("cannot walk into a blocked tile", () => {
    map.blockArea(SPAWN.column + 1, SPAWN.row, 1, 1);
    pressKey("ArrowRight");

    updateTimes(player, 50);

    // Positions are rounded to the nearest tile, so the blocked tile starts half a tile away.
    expect(player.getGridPosition().column).toBeLessThan(SPAWN.column + 0.5);
  });

  it("stops reporting moves once blocked", () => {
    map.blockArea(SPAWN.column + 1, SPAWN.row, 1, 1);
    pressKey("ArrowRight");
    updateTimes(player, 50);
    onMove.mockClear();

    player.update(FRAME);

    expect(onMove).not.toHaveBeenCalled();
  });

  describe("frame rate", () => {
    it.each([30, 60, 144])("covers 3 tiles per second at %i fps", (fps) => {
      pressKey("ArrowUp");

      for (let frame = 0; frame < fps; frame += 1) {
        player.update(1 / fps);
      }

      expect(player.getGridPosition().row).toBeCloseTo(SPAWN.row - 3);
    });

    // After a long pause (hidden tab, slow device), the player must not jump
    // further than the server accepts in one move (1 tile).
    it("moves at most 0.3 tiles in one long frame", () => {
      pressKey("ArrowUp");

      player.update(5);

      expect(player.getGridPosition().row).toBeCloseTo(SPAWN.row - 0.3);
    });
  });

  it("stops listening to the keyboard when destroyed", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const other = new Player(map, map.converter);
    const listeners = add.mock.calls.map(([type, listener]) => [
      type,
      listener,
    ]);

    other.destroy();

    expect(listeners.map(([type]) => type)).toEqual(["keydown", "keyup"]);
    for (const [type, listener] of listeners) {
      expect(remove).toHaveBeenCalledWith(type, listener);
    }
  });

  // F-012
  describe("identity", () => {
    const HOMER = { name: "Homer", company: "Springfield Nuclear" };
    const tags = () =>
      player.children.filter((child) => child instanceof NameTag);
    const labelColours = () =>
      tags().flatMap((tag) =>
        tag.children
          .filter((child) => child instanceof Text)
          .map((text) => text.style.fill),
      );

    it("has no name tag before the visitor picks an identity", () => {
      expect(tags()).toHaveLength(0);
      expect(player.identity).toBeUndefined();
    });

    it("shows the chosen name and company above the player", () => {
      player.setIdentity(HOMER);

      expect(player.identity).toEqual(HOMER);
      expect(tags()).toHaveLength(1);
      expect(tags()[0].y).toBeLessThan(0);
    });

    it("replaces the tag when the identity changes", () => {
      player.setIdentity(HOMER);
      player.setIdentity({ name: "Moe", company: "Moe's Tavern" });

      expect(tags()).toHaveLength(1);
      expect(player.identity?.name).toBe("Moe");
    });

    it("uses the theme picked before or after the identity", () => {
      player.applyTheme(THEMES[1]);
      player.setIdentity(HOMER);
      expect(labelColours()).toEqual([THEMES[1].label, THEMES[1].label]);

      player.applyTheme(THEMES[2]);
      expect(labelColours()).toEqual([THEMES[2].label, THEMES[2].label]);
    });
  });
});
