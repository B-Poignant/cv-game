import { BUILDINGS, type BuildingDefinition } from "./buildings";
import { CollisionMap } from "./CollisionMap";
import type { GridPosition } from "./grid";

// The world rules, shared by the client and the server so both always agree.

/** Map size in tiles. */
export const MAP_SIZE = { columns: 24, rows: 24 } as const;

/** Where every recruiter appears when joining: the crossroads between the districts (F-005). */
export const PLAYER_SPAWN: GridPosition = { column: 12, row: 12 };

/** The hidden chest (F-040), which holds a secret intel card (F-031): in the corner of the quarter with no district yet. */
export const CHEST_POSITION: GridPosition = { column: 21, row: 21 };

/** How fast recruiters walk, in tiles per second. The server enforces it. */
export const PLAYER_SPEED = 3;

/** The dev the recruiters chase (F-060). */
export const DEV_NAME = "Ben";

/** Where the dev appears when a room opens, away from the recruiters' spawn. */
export const DEV_SPAWN: GridPosition = { column: 18, row: 18 };

/** How fast the dev walks, in tiles per second: a bit slower than recruiters. */
export const DEV_SPEED = 2.4;

/** The dev runs from recruiters closer than this, in tiles (F-061). */
export const DEV_FLEE_RADIUS = 4;

/**
 * The dev's burst of speed when a recruiter gets very close (F-061). Faster than recruiters,
 * and short enough a cooldown that a straight chase in the open never closes the gap:
 * he gains (speed - PLAYER_SPEED) × seconds, then loses (PLAYER_SPEED - DEV_SPEED) × cooldown.
 * Walls and corners stop him, so cornering him is how he gets caught.
 */
export const DEV_SPRINT = {
  /** Starts when a recruiter is this close, in tiles. */
  triggerDistance: 1.5,
  /** Tiles per second while sprinting. */
  speed: 4,
  seconds: 1,
  /** Time after a sprint before the next one can start. */
  cooldownSeconds: 1.5,
} as const;

/** Collision map with every building footprint blocked. */
export function createWorldCollisions(
  buildings: readonly BuildingDefinition[] = BUILDINGS,
): CollisionMap {
  const collisions = new CollisionMap();

  for (const { gridPosition, width, height } of buildings) {
    collisions.blockArea(gridPosition.column, gridPosition.row, width, height);
  }

  return collisions;
}

/**
 * On a grid of `columns` × `rows` tiles. Tiles are centred on whole numbers (tile 0 covers
 * -0.5 to 0.5), and positions round to the nearest tile, so the grid spans -0.5 to size - 0.5.
 */
export function isInsideGrid(
  position: GridPosition,
  columns: number,
  rows: number,
): boolean {
  return (
    position.column >= -0.5 &&
    position.column < columns - 0.5 &&
    position.row >= -0.5 &&
    position.row < rows - 0.5
  );
}

export function isInsideMap(position: GridPosition): boolean {
  return isInsideGrid(position, MAP_SIZE.columns, MAP_SIZE.rows);
}

/** Inside the map and not on a blocked tile (positions round to the nearest tile). */
export function isWalkable(
  position: GridPosition,
  collisions: CollisionMap,
): boolean {
  return isInsideMap(position) && !collisions.isBlocked(position);
}
