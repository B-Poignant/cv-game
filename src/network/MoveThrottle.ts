import type { GridPosition } from "../../shared/grid";

/**
 * Sends the player's position at most once every `intervalMs`, so a high refresh rate
 * doesn't flood the room (the server drops a client that sends too much). Moves in between
 * are held, and the latest one goes out as soon as the interval is up, so the server always
 * ends on where the player stopped.
 */
export class MoveThrottle {
  private readonly send: (position: GridPosition) => void;
  private readonly intervalMs: number;
  private pending?: GridPosition;
  private lastSentAt = -Infinity;

  constructor(send: (position: GridPosition) => void, intervalMs: number) {
    this.send = send;
    this.intervalMs = intervalMs;
  }

  /** A new position, at time `now` (ms). Sent now if the interval allows it. */
  public push(position: GridPosition, now: number): void {
    this.pending = position;
    this.flush(now);
  }

  /** Sends the held position, if any, once the interval is up. Called every frame. */
  public flush(now: number): void {
    if (!this.pending || now - this.lastSentAt < this.intervalMs) {
      return;
    }

    this.send(this.pending);
    this.pending = undefined;
    this.lastSentAt = now;
  }
}
