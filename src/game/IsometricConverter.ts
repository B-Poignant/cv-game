import type { GridPosition } from "../../shared/grid";

export interface ScreenPosition {
  x: number;
  y: number;
}

export class IsometricConverter {
  readonly tileWidth: number;
  readonly tileHeight: number;

  constructor(tileWidth: number, tileHeight: number) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
  }

  public toScreen(position: GridPosition): ScreenPosition {
    const screenPosition: ScreenPosition = {
      x: (position.column - position.row) * (this.tileWidth / 2),

      y: (position.column + position.row) * (this.tileHeight / 2),
    };

    return screenPosition;
  }
}
