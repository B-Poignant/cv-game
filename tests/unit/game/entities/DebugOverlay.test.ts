// @vitest-environment happy-dom
import { Graphics } from "pixi.js";
import { describe, expect, it } from "vitest";

import { THEMES } from "../../../../src/config/themes";
import { DebugOverlay } from "../../../../src/game/entities/DebugOverlay";
import { IsometricConverter } from "../../../../src/game/IsometricConverter";

const converter = new IsometricConverter(64, 32);
const BLOCKED = [
  { column: 2, row: 3 },
  { column: 5, row: 1 },
];

/** Bounds include half the stroke: within 3 px of the shape. */
function expectNear(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(3);
}

/** The blocked-tiles layer, then the marks layer. */
function layers(overlay: DebugOverlay): Graphics[] {
  return overlay.children.filter((child) => child instanceof Graphics);
}

// F-051
describe("DebugOverlay", () => {
  it("starts hidden and lets clicks through to the map", () => {
    const overlay = new DebugOverlay(converter, BLOCKED);

    expect(overlay.visible).toBe(false);
    expect(overlay.eventMode).toBe("none");
  });

  it("marks every blocked tile at its place on screen", () => {
    const overlay = new DebugOverlay(converter, BLOCKED);
    const [blocked] = layers(overlay);
    const bounds = blocked.getLocalBounds();
    const first = converter.toScreen(BLOCKED[0]);
    const second = converter.toScreen(BLOCKED[1]);

    // A cross half a tile wide on each: from the leftmost one to the rightmost one.
    expect(bounds.minX).toBeLessThanOrEqual(Math.min(first.x, second.x) - 16);
    expect(bounds.maxX).toBeGreaterThanOrEqual(
      Math.max(first.x, second.x) + 16,
    );
  });

  it("outlines the tile the player stands on, and no arrow when still", () => {
    const overlay = new DebugOverlay(converter, []);
    const [, marks] = layers(overlay);

    overlay.draw({
      player: { column: 3.4, row: 4.2 },
      velocity: { column: 0, row: 0 },
    });

    const tile = converter.toScreen({ column: 3, row: 4 });
    const bounds = marks.getLocalBounds();
    expectNear(bounds.minX, tile.x - 32);
    expectNear(bounds.maxX, tile.x + 32);
    expectNear(bounds.minY, tile.y - 16);
    expectNear(bounds.maxY, tile.y + 16);
  });

  it("adds the velocity arrow and the server's tile when known", () => {
    const overlay = new DebugOverlay(converter, []);
    const [, marks] = layers(overlay);
    const player = { column: 3, row: 4 };

    overlay.draw({ player, velocity: { column: 0, row: 0 } });
    const still = marks.getLocalBounds().maxX;
    overlay.draw({
      player,
      server: { column: 6, row: 4 },
      velocity: { column: 3, row: 0 },
    });

    expect(marks.getLocalBounds().maxX).toBeGreaterThan(still);
    expectNear(
      marks.getLocalBounds().maxX,
      converter.toScreen({ column: 6, row: 4 }).x + 32,
    );
  });

  it("redraws in the theme's label colour", () => {
    const overlay = new DebugOverlay(converter, BLOCKED);
    const [blocked] = layers(overlay);

    overlay.applyTheme(THEMES[1]);

    const strokes = blocked.context.instructions.filter(
      (instruction) => instruction.action === "stroke",
    );
    expect(strokes).toHaveLength(1);
    expect(strokes[0].data.style.color).toBe(THEMES[1].label);
  });
});
