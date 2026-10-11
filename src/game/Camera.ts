import { Container } from "pixi.js";
import type { Renderer } from "pixi.js";

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class Camera {
  private readonly world: Container;
  private readonly renderer: Renderer;
  private readonly bounds: MapBounds;

  private zoom = 1;

  constructor(world: Container, renderer: Renderer, bounds: MapBounds) {
    this.world = world;
    this.renderer = renderer;
    this.bounds = bounds;
  }

  public fitMap(): void {
    const viewportWidth = this.renderer.width;
    const viewportHeight = this.renderer.height;

    const mapWidth = this.bounds.maxX - this.bounds.minX;

    const mapHeight = this.bounds.maxY - this.bounds.minY;

    const padding = 40;

    const availableWidth = viewportWidth - padding * 2;

    const availableHeight = viewportHeight - padding * 2;

    this.zoom = Math.min(
      availableWidth / mapWidth,
      availableHeight / mapHeight,
      1,
    );

    this.world.scale.set(this.zoom);

    const scaledMapWidth = mapWidth * this.zoom;

    const scaledMapHeight = mapHeight * this.zoom;

    const x =
      (viewportWidth - scaledMapWidth) / 2 - this.bounds.minX * this.zoom;

    const y =
      (viewportHeight - scaledMapHeight) / 2 - this.bounds.minY * this.zoom;

    this.world.position.set(x, y);
  }

  public resize(): void {
    this.fitMap();
  }
}
