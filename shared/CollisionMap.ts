import type { GridPosition } from "./grid";

export class CollisionMap {
  private readonly blockedTiles = new Set<string>();

  private getKey(column: number, row: number): string {
    return `${column}:${row}`;
  }

  public block(column: number, row: number): void {
    this.blockedTiles.add(this.getKey(column, row));
  }

  public blockArea(
    startColumn: number,
    startRow: number,
    width: number,
    height: number,
  ): void {
    for (let row = startRow; row < startRow + height; row += 1) {
      for (
        let column = startColumn;
        column < startColumn + width;
        column += 1
      ) {
        this.block(column, row);
      }
    }
  }

  /** Every blocked tile, in the order it was blocked (the debug overlay draws them, F-051). */
  public blockedPositions(): GridPosition[] {
    return [...this.blockedTiles].map((key) => {
      const [column = 0, row = 0] = key.split(":").map(Number);

      return { column, row };
    });
  }

  public isBlocked(position: GridPosition): boolean {
    const column = Math.round(position.column);

    const row = Math.round(position.row);

    return this.blockedTiles.has(this.getKey(column, row));
  }
}
