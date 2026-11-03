import { Container, Graphics, Text } from "pixi.js";

import { DEFAULT_THEME, type Theme } from "../../config/themes";
import type { GridPosition } from "../../../shared/grid";
import type { IsometricConverter } from "../IsometricConverter";

export class Building extends Container {
  readonly title: string;
  readonly gridPosition: GridPosition;
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly color: number;

  private readonly converter: IsometricConverter;
  private titleText?: Text;

  /** `converter` is the map's, so the footprint lines up with its tiles. */
  constructor(
    converter: IsometricConverter,
    title: string,
    gridPosition: GridPosition,
    width: number = 2,
    height: number = 2,
    color: number = 0x7c3aed,
  ) {
    super();

    this.converter = converter;
    this.title = title;
    this.gridPosition = gridPosition;
    this.gridWidth = width;
    this.gridHeight = height;
    this.color = color;

    this.createMarker();
  }

  /** Recolours the title so it stays readable on the theme's tiles. */
  public applyTheme(theme: Theme): void {
    if (this.titleText) {
      this.titleText.style.fill = theme.label;
    }
  }

  private createMarker(): void {
    const { tileWidth, tileHeight } = this.converter;

    for (let row = 0; row < this.gridHeight; row += 1) {
      for (let column = 0; column < this.gridWidth; column += 1) {
        const tile = new Graphics();

        tile
          .moveTo(0, -tileHeight / 2)
          .lineTo(tileWidth / 2, 0)
          .lineTo(0, tileHeight / 2)
          .lineTo(-tileWidth / 2, 0)
          .closePath()
          .fill({
            color: this.color,
            alpha: 0.45,
          })
          .stroke({
            color: this.color,
            width: 2,
          });

        const screen = this.converter.toScreen({ column, row });

        tile.position.set(screen.x, screen.y);

        this.addChild(tile);
      }
    }

    const text = new Text({
      text: this.title,
      style: {
        fontFamily: "monospace",
        fontSize: 12,
        fill: DEFAULT_THEME.label,
      },
    });

    this.titleText = text;

    text.anchor.set(0.5);

    // The title sits above the centre of the footprint.
    const center = this.converter.toScreen({
      column: (this.gridWidth - 1) / 2,
      row: (this.gridHeight - 1) / 2,
    });

    text.position.set(center.x, center.y - 20);

    this.addChild(text);

    this.eventMode = "static";
    this.cursor = "pointer";

    // Pixi's accessibility layer (activated with Tab) turns this into a real <button>.
    this.accessible = true;
    this.accessibleType = "button";
    this.accessibleTitle = this.title;
    this.accessibleHint = `Open ${this.title}`;
  }
}
