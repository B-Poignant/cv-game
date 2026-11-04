import type { GridPosition } from "../../shared/grid";

/** What the scene knows this frame, read through getters only (F-051). */
export interface DebugSample {
  player: GridPosition;
  /** The local player's position as the server last accepted it, once connected. */
  server?: GridPosition;
  dev?: GridPosition;
  /** Other visitors in the room. */
  others: number;
  connected: boolean;
}

export interface DebugReadout {
  /** Tiles per second along each axis, measured from the last frame. */
  velocity: GridPosition;
  lines: string[];
}

/** Weight of the newest frame in the smoothed FPS, so the number doesn't flicker. */
const FPS_SMOOTHING = 0.1;

/** Grid directions, named after the keys that move that way (`Player`). */
const DIRECTIONS: Readonly<Record<string, string>> = {
  "0,-1": "↑ up",
  "0,1": "↓ down",
  "-1,0": "← left",
  "1,0": "→ right",
  "-1,-1": "↖ up-left",
  "1,-1": "↗ up-right",
  "-1,1": "↙ down-left",
  "1,1": "↘ down-right",
};

/**
 * Turns the scene's state, frame after frame, into the debug readout (F-051): positions,
 * speed and direction (measured from how far the player moved), the others, FPS. It only
 * reads: nothing here changes the game.
 */
export class DebugMeter {
  private previous?: GridPosition;
  private fps?: number;

  public update(deltaSeconds: number, sample: DebugSample): DebugReadout {
    const velocity = this.measureVelocity(deltaSeconds, sample.player);

    this.previous = { ...sample.player };
    if (deltaSeconds > 0) {
      const instant = 1 / deltaSeconds;

      this.fps =
        this.fps === undefined
          ? instant
          : this.fps + (instant - this.fps) * FPS_SMOOTHING;
    }

    return { velocity, lines: this.lines(sample, velocity) };
  }

  private measureVelocity(
    deltaSeconds: number,
    player: GridPosition,
  ): GridPosition {
    if (!this.previous || deltaSeconds <= 0) {
      return { column: 0, row: 0 };
    }

    return {
      column: (player.column - this.previous.column) / deltaSeconds,
      row: (player.row - this.previous.row) / deltaSeconds,
    };
  }

  private lines(sample: DebugSample, velocity: GridPosition): string[] {
    const speed = Math.hypot(velocity.column, velocity.row);

    return [
      `Player   ${formatPosition(sample.player)}  tile ${formatTile(sample.player)}`,
      `Server   ${sample.server ? formatPosition(sample.server) : "—"}`,
      `Speed    ${speed.toFixed(2)} tiles/s  ${directionOf(velocity)}`,
      `Ben      ${sample.dev ? formatPosition(sample.dev) : "—"}`,
      `Others   ${String(sample.others)}`,
      `Network  ${sample.connected ? "online" : "offline"}`,
      `FPS      ${this.fps === undefined ? "—" : Math.round(this.fps).toString()}`,
    ];
  }
}

export function formatPosition(position: GridPosition): string {
  return `(${position.column.toFixed(2)}, ${position.row.toFixed(2)})`;
}

/** The tile a position stands on: tiles are centred on whole numbers. */
export function formatTile(position: GridPosition): string {
  return `(${String(Math.round(position.column))}, ${String(Math.round(position.row))})`;
}

/** "still", or one of the 8 grid directions the velocity points to. */
export function directionOf(velocity: GridPosition): string {
  const key = `${String(Math.sign(velocity.column))},${String(Math.sign(velocity.row))}`;

  return DIRECTIONS[key] ?? "still";
}
