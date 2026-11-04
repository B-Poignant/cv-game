import { Container, Graphics } from "pixi.js";

import type { GridPosition } from "../../../shared/grid";
import type { Theme } from "../../config/themes";
import type { IsometricConverter } from "../IsometricConverter";

/** How far the direction arrow reaches, in tiles per tile/s of speed. */
const ARROW_SECONDS = 0.5;

export interface DebugMarks {
  player: GridPosition;
  server?: GridPosition;
  velocity: GridPosition;
}

/**
 * The map half of the debug mode (F-051): a cross on every blocked tile, an outline on the
 * player's tile and a fainter one on the tile the server last accepted, and an arrow for
 * the player's velocity. Everything uses the theme's `label` colour, which keeps a 4.5:1
 * contrast with the tiles on every theme. It only draws: it never changes the game.
 */
export class DebugOverlay extends Container {
  private readonly converter: IsometricConverter;
  private readonly blocked: readonly GridPosition[];
  private readonly blockedLayer = new Graphics();
  private readonly marksLayer = new Graphics();
  private colour = 0xffffff;

  constructor(converter: IsometricConverter, blocked: readonly GridPosition[]) {
    super();

    this.converter = converter;
    this.blocked = blocked;
    this.label = "debug-overlay";
    // Purely visual: clicks go through to the buildings and the chest underneath.
    this.eventMode = "none";
    this.visible = false;
    this.addChild(this.blockedLayer, this.marksLayer);
    this.drawBlocked();
  }

  public applyTheme(theme: Theme): void {
    this.colour = theme.label;
    this.drawBlocked();
  }

  public draw(marks: DebugMarks): void {
    const layer = this.marksLayer.clear();

    this.outlineTile(layer, marks.player).stroke({
      width: 2,
      color: this.colour,
    });

    if (marks.server) {
      this.outlineTile(layer, marks.server).stroke({
        width: 1,
        color: this.colour,
        alpha: 0.6,
      });
    }

    const from = this.converter.toScreen(marks.player);
    const to = this.converter.toScreen({
      column: marks.player.column + marks.velocity.column * ARROW_SECONDS,
      row: marks.player.row + marks.velocity.row * ARROW_SECONDS,
    });

    if (from.x !== to.x || from.y !== to.y) {
      layer
        .moveTo(from.x, from.y)
        .lineTo(to.x, to.y)
        .stroke({ width: 3, color: this.colour })
        .circle(to.x, to.y, 4)
        .fill(this.colour);
    }
  }

  private drawBlocked(): void {
    const layer = this.blockedLayer.clear();
    const halfWidth = this.converter.tileWidth / 4;
    const halfHeight = this.converter.tileHeight / 4;

    for (const tile of this.blocked) {
      const { x, y } = this.converter.toScreen(tile);

      layer
        .moveTo(x - halfWidth, y - halfHeight)
        .lineTo(x + halfWidth, y + halfHeight)
        .moveTo(x + halfWidth, y - halfHeight)
        .lineTo(x - halfWidth, y + halfHeight);
    }

    layer.stroke({ width: 2, color: this.colour, alpha: 0.8 });
  }

  /** The diamond of the tile `position` stands on (tiles are centred on whole numbers). */
  private outlineTile(layer: Graphics, position: GridPosition): Graphics {
    const { x, y } = this.converter.toScreen({
      column: Math.round(position.column),
      row: Math.round(position.row),
    });
    const { tileWidth, tileHeight } = this.converter;

    return layer
      .moveTo(x, y - tileHeight / 2)
      .lineTo(x + tileWidth / 2, y)
      .lineTo(x, y + tileHeight / 2)
      .lineTo(x - tileWidth / 2, y)
      .closePath();
  }
}
