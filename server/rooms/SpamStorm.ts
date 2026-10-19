import type { GridPosition } from "../../shared/grid";
import { SPAM } from "../../shared/spam";
import { MAP_SIZE } from "../../shared/world";

/** A recruiter the emails can hit. */
export interface SpamTarget extends GridPosition {
  readonly id: string;
}

export interface FlyingEmail extends GridPosition {
  readonly id: number;
  /** Unit direction it flies in, along a row or a column. */
  readonly direction: GridPosition;
}

/** Who got hit this update, and whose slowdown is over. */
export interface SpamChanges {
  slowed: string[];
  recovered: string[];
}

export interface SpamStormOptions {
  random: () => number;
}

/** Longest step simulated at once, so a stalled server can't fly an email past a recruiter. */
const MAX_STEP_SECONDS = 0.1;

/** Emails start and end just outside the map. */
const EDGE_MARGIN = 1;

/**
 * Recruiter-spam hazards (F-063), as pure logic like `DevWanderer`. Emails are aimed along
 * a random recruiter's row or column, from one edge of the map to the other, over the
 * buildings. An email that hits a recruiter disappears and slows them down for a while.
 */
export class SpamStorm {
  private readonly random: () => number;
  private readonly slowTimers = new Map<string, number>();

  private flying: FlyingEmail[] = [];
  private nextSpawnIn: number = SPAM.firstSpawnSeconds;
  private nextId = 1;

  constructor(options: SpamStormOptions) {
    this.random = options.random;
  }

  public get emails(): readonly FlyingEmail[] {
    return this.flying;
  }

  public isSlowed(id: string): boolean {
    return this.slowTimers.has(id);
  }

  /** Advances `deltaSeconds`: spawns, flies and hits emails, and runs the slowdowns down. */
  public update(
    deltaSeconds: number,
    targets: readonly SpamTarget[],
  ): SpamChanges {
    const changes: SpamChanges = { slowed: [], recovered: [] };
    let remaining = Math.max(0, deltaSeconds);

    while (remaining > 1e-9) {
      const seconds = Math.min(remaining, MAX_STEP_SECONDS);

      this.step(seconds, targets, changes);
      remaining -= seconds;
    }

    return changes;
  }

  /** Forgets a recruiter who left. */
  public remove(id: string): void {
    this.slowTimers.delete(id);
  }

  private step(
    seconds: number,
    targets: readonly SpamTarget[],
    changes: SpamChanges,
  ): void {
    this.recover(seconds, changes);
    this.spawn(seconds, targets);
    this.fly(seconds);
    this.hit(targets, changes);
  }

  private recover(seconds: number, changes: SpamChanges): void {
    for (const [id, left] of this.slowTimers) {
      if (left - seconds > 1e-9) {
        this.slowTimers.set(id, left - seconds);
        continue;
      }

      this.slowTimers.delete(id);
      changes.recovered.push(id);
    }
  }

  private spawn(seconds: number, targets: readonly SpamTarget[]): void {
    this.nextSpawnIn -= seconds;

    // Ignores floating-point leftovers, or ten 0.1 s steps would miss a 1 s timer.
    if (this.nextSpawnIn > 1e-9) {
      return;
    }

    this.nextSpawnIn = SPAM.spawnIntervalSeconds;

    if (targets.length === 0 || this.flying.length >= SPAM.maxEmails) {
      return;
    }

    const target = targets[Math.floor(this.random() * targets.length)];

    this.flying.push(this.aimAt(target));
    this.nextId += 1;
  }

  /** Along the target's row or column, from the left/top edge or the right/bottom one. */
  private aimAt(target: SpamTarget): FlyingEmail {
    const isAlongRow = this.random() < 0.5;
    const sign = this.random() < 0.5 ? 1 : -1;
    const size = isAlongRow ? MAP_SIZE.columns : MAP_SIZE.rows;
    const start = sign > 0 ? -EDGE_MARGIN : size - 1 + EDGE_MARGIN;

    return isAlongRow
      ? {
          id: this.nextId,
          column: start,
          row: Math.round(target.row),
          direction: { column: sign, row: 0 },
        }
      : {
          id: this.nextId,
          column: Math.round(target.column),
          row: start,
          direction: { column: 0, row: sign },
        };
  }

  private fly(seconds: number): void {
    const distance = SPAM.speed * seconds;

    this.flying = this.flying
      .map((email) => ({
        ...email,
        column: email.column + email.direction.column * distance,
        row: email.row + email.direction.row * distance,
      }))
      .filter((email) => isOnFlightArea(email));
  }

  private hit(targets: readonly SpamTarget[], changes: SpamChanges): void {
    for (const target of targets) {
      const email = this.flying.find(
        (candidate) =>
          Math.hypot(
            candidate.column - target.column,
            candidate.row - target.row,
          ) < SPAM.hitDistance,
      );

      if (!email) {
        continue;
      }

      this.flying = this.flying.filter((candidate) => candidate !== email);
      this.slowTimers.set(target.id, SPAM.slowSeconds);
      changes.slowed.push(target.id);
      changes.recovered = changes.recovered.filter((id) => id !== target.id);
    }
  }
}

function isOnFlightArea({ column, row }: GridPosition): boolean {
  return (
    column >= -EDGE_MARGIN &&
    column <= MAP_SIZE.columns - 1 + EDGE_MARGIN &&
    row >= -EDGE_MARGIN &&
    row <= MAP_SIZE.rows - 1 + EDGE_MARGIN
  );
}
