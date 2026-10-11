import type { CollisionMap } from "../../shared/CollisionMap";
import type { GridPosition } from "../../shared/grid";
import { isWalkable } from "../../shared/world";
import { fleeStep, threatsWithin } from "./flee";

/** A burst of speed when a recruiter gets very close (F-061). */
export interface SprintOptions {
  triggerDistance: number;
  speed: number;
  seconds: number;
  cooldownSeconds: number;
}

export interface WanderOptions {
  /** Tiles per second. */
  speed: number;
  /** He runs from recruiters closer than this, in tiles (F-061). */
  fleeRadius: number;
  sprint: SprintOptions;
  /** Farthest target picked, in tiles along each axis. */
  maxTargetDistance: number;
  /** Pause after reaching a target, in seconds. */
  minPauseSeconds: number;
  maxPauseSeconds: number;
  /** Returns a number in [0, 1). Injected so tests are deterministic. */
  random: () => number;
}

/** Tries before giving up on finding a target this tick (all nearby tiles blocked). */
const TARGET_ATTEMPTS = 10;

/** Longest step simulated at once, in seconds, so a stalled server can't jump him through a building. */
const MAX_STEP_SECONDS = 0.1;

/** Timers below this count as run out: 0.5 - 5 × 0.1 leaves 3e-17 s, not 0. */
const TIMER_EPSILON = 1e-9;

/**
 * How the dev moves. When a recruiter comes within `fleeRadius`, he runs away (F-061, see
 * `fleeStep`). Otherwise he wanders (F-060): walk in a straight line to a random walkable
 * tile nearby, pause, pick another. If the line runs into a building, he picks a new target.
 * Pure logic, no timers: the room calls `update` from its simulation loop.
 */
export class DevWanderer {
  private readonly collisions: CollisionMap;
  private readonly options: WanderOptions;

  private current: GridPosition;
  private target?: GridPosition;
  private pauseSeconds = 0;
  private sprintSeconds = 0;
  private sprintCooldownSeconds = 0;

  constructor(
    collisions: CollisionMap,
    start: GridPosition,
    options: WanderOptions,
  ) {
    this.collisions = collisions;
    this.options = options;
    this.current = { ...start };
  }

  public get position(): GridPosition {
    return { ...this.current };
  }

  public get isSprinting(): boolean {
    return this.sprintSeconds > 0;
  }

  /** Advances by `deltaSeconds`, running from `recruiters` if any is close, and returns the new position. */
  public update(
    deltaSeconds: number,
    recruiters: readonly GridPosition[] = [],
  ): GridPosition {
    const step = Math.min(deltaSeconds, MAX_STEP_SECONDS);
    const threats = threatsWithin(
      this.current,
      recruiters,
      this.options.fleeRadius,
    );

    if (threats.length > 0) {
      this.startSprintIfClose(threats);
      this.flee(threats, this.currentSpeed() * step);
    } else {
      this.wander(step);
    }

    this.tickSprint(step);

    return this.position;
  }

  private wander(step: number): void {
    if (this.pauseSeconds > 0) {
      this.pauseSeconds = Math.max(0, this.pauseSeconds - step);

      return;
    }

    this.target ??= this.pickTarget();

    if (this.target) {
      this.walkTowards(this.target, this.options.speed * step);
    }
  }

  /** Sprints when a recruiter is within reach and the last sprint has cooled down. */
  private startSprintIfClose(threats: readonly GridPosition[]): void {
    const { triggerDistance, seconds } = this.options.sprint;
    const ready = this.sprintSeconds <= 0 && this.sprintCooldownSeconds <= 0;

    if (
      ready &&
      threatsWithin(this.current, threats, triggerDistance).length > 0
    ) {
      this.sprintSeconds = seconds;
    }
  }

  private currentSpeed(): number {
    return this.isSprinting ? this.options.sprint.speed : this.options.speed;
  }

  /** Runs the sprint down, then the cooldown. */
  private tickSprint(step: number): void {
    if (this.sprintSeconds > 0) {
      this.sprintSeconds -= step;

      if (this.sprintSeconds <= TIMER_EPSILON) {
        this.sprintSeconds = 0;
        this.sprintCooldownSeconds = this.options.sprint.cooldownSeconds;
      }

      return;
    }

    this.sprintCooldownSeconds -= step;

    if (this.sprintCooldownSeconds <= TIMER_EPSILON) {
      this.sprintCooldownSeconds = 0;
    }
  }

  /** Drops any wander plan: once safe, he picks a fresh target without pausing first. */
  private flee(threats: readonly GridPosition[], stepLength: number): void {
    this.target = undefined;
    this.pauseSeconds = 0;

    const next = fleeStep(this.current, threats, stepLength, this.collisions);

    if (next) {
      this.current = next;
    }
  }

  private walkTowards(target: GridPosition, maxStep: number): void {
    const dx = target.column - this.current.column;
    const dy = target.row - this.current.row;
    const distance = Math.hypot(dx, dy);

    if (distance <= maxStep) {
      this.current = { ...target };
      this.arrive();

      return;
    }

    const next = {
      column: this.current.column + (dx / distance) * maxStep,
      row: this.current.row + (dy / distance) * maxStep,
    };

    if (!isWalkable(next, this.collisions)) {
      this.target = undefined;

      return;
    }

    this.current = next;
  }

  private arrive(): void {
    const { minPauseSeconds, maxPauseSeconds, random } = this.options;

    this.target = undefined;
    this.pauseSeconds =
      minPauseSeconds + random() * (maxPauseSeconds - minPauseSeconds);
  }

  private pickTarget(): GridPosition | undefined {
    const { maxTargetDistance, random } = this.options;

    for (let attempt = 0; attempt < TARGET_ATTEMPTS; attempt += 1) {
      const candidate = {
        column: Math.round(
          this.current.column + (random() * 2 - 1) * maxTargetDistance,
        ),
        row: Math.round(
          this.current.row + (random() * 2 - 1) * maxTargetDistance,
        ),
      };

      if (isWalkable(candidate, this.collisions)) {
        return candidate;
      }
    }

    return undefined;
  }
}
