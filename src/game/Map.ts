import { Container, Graphics } from "pixi.js";

import { DEFAULT_THEME, type Theme } from "../config/themes";
import { CollisionMap } from "../../shared/CollisionMap";
import type { GridPosition } from "../../shared/grid";
import { isInsideGrid } from "../../shared/world";
import { IsometricConverter } from "./IsometricConverter";

export class GameMap extends Container {
  public readonly converter: IsometricConverter;
  public readonly collisions: CollisionMap;
  public readonly columns: number;
  public readonly rows: number;

  private readonly tileWidth = 64;
  private readonly tileHeight = 32;

  private readonly tiles: Graphics[] = [];
  private currentTheme: Theme = DEFAULT_THEME;

  constructor(columns: number, rows: number) {
    super();

    this.columns = columns;
    this.rows = rows;
    this.converter = new IsometricConverter(this.tileWidth, this.tileHeight);

    this.collisions = new CollisionMap();

    this.createMap();
  }

  private createMap(): void {
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        this.createTile({
          column,
          row,
        });
      }
    }
  }

  private createTile(position: GridPosition): void {
    const screenPosition = this.converter.toScreen(position);

    const tile = new Graphics();

    this.drawTile(tile);

    tile.position.set(screenPosition.x, screenPosition.y);

    this.tiles.push(tile);
    this.addChild(tile);
  }

  private drawTile(tile: Graphics): void {
    tile
      .clear()
      .moveTo(0, -this.tileHeight / 2)
      .lineTo(this.tileWidth / 2, 0)
      .lineTo(0, this.tileHeight / 2)
      .lineTo(-this.tileWidth / 2, 0)
      .closePath()
      .fill(this.currentTheme.tile.fill)
      .stroke({
        color: this.currentTheme.tile.stroke,
        width: 1,
      });
  }

  public get theme(): Theme {
    return this.currentTheme;
  }

  /** Redraws every tile with the theme's colours. */
  public applyTheme(theme: Theme): void {
    this.currentTheme = theme;

    for (const tile of this.tiles) {
      this.drawTile(tile);
    }
  }

  public isInside(position: GridPosition): boolean {
    return isInsideGrid(position, this.columns, this.rows);
  }

  public canWalkTo(position: GridPosition): boolean {
    if (!this.isInside(position)) {
      return false;
    }

    return !this.collisions.isBlocked(position);
  }

  public blockArea(
    column: number,
    row: number,
    width: number,
    height: number,
  ): void {
    this.collisions.blockArea(column, row, width, height);
  }

  public getWidth(): number {
    return (this.columns + this.rows) * (this.tileWidth / 2);
  }

  public getHeight(): number {
    return (this.columns + this.rows) * (this.tileHeight / 2);
  }
}
