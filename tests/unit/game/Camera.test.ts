// @vitest-environment happy-dom
import { Container, type Renderer } from "pixi.js";
import { describe, expect, it } from "vitest";

import { Camera, type MapBounds } from "../../../src/game/Camera";

/** Camera only reads the viewport size, so a minimal fake is enough. */
function fakeRenderer(width: number, height: number): Renderer {
  return { width, height } as Renderer;
}

describe("Camera.fitMap", () => {
  // A 400 x 100 px map whose left edge is at x = -200.
  const bounds: MapBounds = { minX: -200, maxX: 200, minY: 0, maxY: 100 };

  it("never zooms in past 100% on a large screen", () => {
    const world = new Container();

    new Camera(world, fakeRenderer(1920, 1080), bounds).fitMap();

    expect(world.scale.x).toBe(1);
  });

  it("centres the map in the viewport", () => {
    const world = new Container();

    new Camera(world, fakeRenderer(800, 600), bounds).fitMap();

    // x: (800 - 400) / 2 + 200 to shift minX on screen. y: (600 - 100) / 2.
    expect({ x: world.x, y: world.y }).toEqual({ x: 400, y: 250 });
  });

  it("zooms out to fit a small screen, keeping a 40px padding", () => {
    const world = new Container();

    new Camera(world, fakeRenderer(280, 240), bounds).fitMap();

    // 280 - 2 * 40 = 200px available for a 400px map: zoom 0.5.
    expect(world.scale.x).toBe(0.5);
    expect(world.scale.y).toBe(0.5);
    expect({ x: world.x, y: world.y }).toEqual({ x: 140, y: 95 });
  });

  it("refits after the viewport is resized", () => {
    const world = new Container();
    const renderer = fakeRenderer(1920, 1080);
    const camera = new Camera(world, renderer, bounds);
    camera.fitMap();

    Object.assign(renderer, { width: 280, height: 240 });
    camera.resize();

    expect(world.scale.x).toBe(0.5);
  });
});
