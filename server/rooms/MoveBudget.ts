/**
 * How far a client may still move, in tiles (a token bucket). It refills over time and is
 * capped, so short bursts (network jitter) pass but a client can't move faster than
 * `refillPerSecond` on average, however many messages it sends.
 */
export class MoveBudget {
  private readonly capacity: number;
  private refillPerSecond: number;
  private available: number;
  private lastRefillMs: number;

  constructor(capacity: number, refillPerSecond: number, nowMs: number) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    this.available = capacity;
    this.lastRefillMs = nowMs;
  }

  /** Spends `distance` tiles and returns true, or returns false (spending nothing) if not enough is left. */
  public tryMove(distance: number, nowMs: number): boolean {
    this.refill(nowMs);

    if (distance > this.available) {
      return false;
    }

    this.available -= distance;

    return true;
  }

  /**
   * Changes how fast the budget refills from `nowMs` on (a spam hit slows a recruiter down,
   * F-063). Time already passed still refills at the old rate.
   */
  public setRefillRate(refillPerSecond: number, nowMs: number): void {
    this.refill(nowMs);
    this.refillPerSecond = refillPerSecond;
  }

  private refill(nowMs: number): void {
    const elapsedSeconds = Math.max(0, nowMs - this.lastRefillMs) / 1000;

    this.available = Math.min(
      this.capacity,
      this.available + elapsedSeconds * this.refillPerSecond,
    );
    this.lastRefillMs = nowMs;
  }
}
