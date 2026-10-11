import { describe, expect, it } from "vitest";

import {
  DevWanderer,
  type WanderOptions,
} from "../../../../server/rooms/DevWanderer";
import { CollisionMap } from "../../../../shared/CollisionMap";
import type { GridPosition } from "../../../../shared/grid";
import {
  createWorldCollisions,
  DEV_FLEE_RADIUS,
  DEV_SPAWN,
  DEV_SPEED,
  DEV_SPRINT,
  isWalkable,
  PLAYER_SPEED,
} from "../../../../shared/world";

const SPEED = 2;
const MAX_TARGET_DISTANCE = 5;
const FLEE_RADIUS = 4;

/** Tests that aren't about sprinting: it never triggers. */
const NO_SPRINT = {
  triggerDistance: 0,
  speed: SPEED,
  seconds: 0,
  cooldownSeconds: 0,
};

/** Easy numbers for the sprint tests: 1 tile trigger, 5 tiles/s for 0.5 s, 1 s cooldown. */
const SPRINT = {
  triggerDistance: 1,
  speed: 5,
  seconds: 0.5,
  cooldownSeconds: 1,
};

/** Returns the given values in order, then repeats the last one. */
function scripted(...values: number[]): () => number {
  let index = 0;

  return () => values[Math.min(index++, values.length - 1)];
}

/** Small deterministic PRNG (mulberry32), for long random walks. */
function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random value that puts the target `offset` tiles away on one axis. */
function towards(offset: number): number {
  return (offset / MAX_TARGET_DISTANCE + 1) / 2;
}

function createWanderer(
  random: () => number,
  {
    start = { column: 5, row: 5 },
    collisions = new CollisionMap(),
    options = {},
  }: {
    start?: GridPosition;
    collisions?: CollisionMap;
    options?: Partial<WanderOptions>;
  } = {},
) {
  return new DevWanderer(collisions, start, {
    speed: SPEED,
    fleeRadius: FLEE_RADIUS,
    sprint: NO_SPRINT,
    maxTargetDistance: MAX_TARGET_DISTANCE,
    minPauseSeconds: 1,
    maxPauseSeconds: 1,
    random,
    ...options,
  });
}

// F-060
describe("DevWanderer", () => {
  it("starts where he spawns", () => {
    expect(createWanderer(scripted(0.5)).position).toEqual({
      column: 5,
      row: 5,
    });
  });

  it("walks in a straight line towards a random target at his speed", () => {
    const wanderer = createWanderer(scripted(towards(4), towards(0)));

    const position = wanderer.update(0.1);

    expect(position.column).toBeCloseTo(5.2);
    expect(position.row).toBeCloseTo(5);
  });

  it("stops on the target, then pauses before moving again", () => {
    const wanderer = createWanderer(
      scripted(towards(1), towards(0), 0, towards(-1), towards(0)),
    );

    for (let tick = 0; tick < 6; tick += 1) {
      wanderer.update(0.1);
    }
    expect(wanderer.position).toEqual({ column: 6, row: 5 });

    // 1 s pause: still there after 0.9 s, moving again after it.
    for (let tick = 0; tick < 9; tick += 1) {
      wanderer.update(0.1);
    }
    expect(wanderer.position).toEqual({ column: 6, row: 5 });

    wanderer.update(0.1);
    wanderer.update(0.1);
    expect(wanderer.position.column).toBeLessThan(6);
  });

  it("never walks into a building: he stops and picks another target", () => {
    const collisions = new CollisionMap();
    collisions.block(7, 5);
    const wanderer = createWanderer(
      scripted(towards(4), towards(0), towards(0), towards(3)),
      { collisions },
    );

    for (let tick = 0; tick < 20; tick += 1) {
      wanderer.update(0.1);
      expect(isWalkable(wanderer.position, collisions)).toBe(true);
    }

    // Turned away along the row instead of pushing into (7, 5).
    expect(wanderer.position.column).toBeLessThan(6.5);
    expect(wanderer.position.row).toBeGreaterThan(5);
  });

  it("stays put when no walkable target is found", () => {
    // Every candidate lands outside the map.
    const wanderer = createWanderer(scripted(0), {
      start: { column: 0, row: 0 },
    });

    expect(wanderer.update(0.1)).toEqual({ column: 0, row: 0 });
  });

  it("moves at most 0.1 s worth per update, even after a long stall", () => {
    const wanderer = createWanderer(scripted(towards(5), towards(0)));

    expect(wanderer.update(10).column).toBeCloseTo(5 + SPEED * 0.1);
  });

  it("keeps to walkable tiles and his speed over a long random walk", () => {
    const collisions = createWorldCollisions();
    const wanderer = createWanderer(seeded(42), {
      start: DEV_SPAWN,
      collisions,
      options: { minPauseSeconds: 0, maxPauseSeconds: 0.5 },
    });
    let previous = wanderer.position;
    let travelled = 0;

    for (let tick = 0; tick < 2000; tick += 1) {
      const position = wanderer.update(0.05);
      const step = Math.hypot(
        position.column - previous.column,
        position.row - previous.row,
      );

      expect(isWalkable(position, collisions)).toBe(true);
      expect(step).toBeLessThanOrEqual(SPEED * 0.05 + 1e-9);
      travelled += step;
      previous = position;
    }

    expect(travelled).toBeGreaterThan(20);
  });

  // F-061
  describe("with recruiters nearby", () => {
    it("runs away from a recruiter inside the flee radius", () => {
      const wanderer = createWanderer(scripted(towards(-4), towards(0)));
      const recruiter = { column: 3, row: 5 };

      const position = wanderer.update(0.1, [recruiter]);

      // Away from the recruiter, not towards his wander target on the same side.
      expect(position.column).toBeCloseTo(5 + SPEED * 0.1);
    });

    it("ignores recruiters outside the flee radius", () => {
      const wanderer = createWanderer(scripted(towards(-4), towards(0)));

      const position = wanderer.update(0.1, [
        { column: 5 + FLEE_RADIUS, row: 5 },
      ]);

      expect(position.column).toBeCloseTo(5 - SPEED * 0.1);
    });

    it("stops pausing to run, then wanders again once safe", () => {
      const wanderer = createWanderer(
        scripted(towards(0), towards(0), 0, towards(3), towards(0)),
        { options: { minPauseSeconds: 5, maxPauseSeconds: 5 } },
      );
      wanderer.update(0.1); // target is his own tile: arrives and starts a 5 s pause

      const fled = wanderer.update(0.1, [{ column: 4, row: 5 }]);
      expect(fled.column).toBeGreaterThan(5);

      const wandering = wanderer.update(0.1, []);
      expect(wandering.column).toBeGreaterThan(fled.column);
    });
  });

  // F-061
  describe("sprinting", () => {
    /** Runs one 0.1 s update with a recruiter 0.5 tile to his left; returns how far he went. */
    function stepAwayFromCloseRecruiter(wanderer: DevWanderer): number {
      const before = wanderer.position;
      const after = wanderer.update(0.1, [
        { column: before.column - 0.5, row: before.row },
      ]);

      return after.column - before.column;
    }

    it("sprints when a recruiter gets within the trigger distance", () => {
      const wanderer = createWanderer(scripted(0.5), {
        options: { sprint: SPRINT },
      });

      expect(stepAwayFromCloseRecruiter(wanderer)).toBeCloseTo(0.5);
      expect(wanderer.isSprinting).toBe(true);
    });

    it("runs at normal speed when the recruiter is close but not that close", () => {
      const wanderer = createWanderer(scripted(0.5), {
        options: { sprint: SPRINT },
      });

      const position = wanderer.update(0.1, [{ column: 3, row: 5 }]);

      expect(position.column).toBeCloseTo(5 + SPEED * 0.1);
      expect(wanderer.isSprinting).toBe(false);
    });

    it("sprints for its duration, cools down, then can sprint again", () => {
      const wanderer = createWanderer(scripted(0.5), {
        start: { column: 2, row: 10 },
        options: { sprint: SPRINT },
      });
      const steps = Array.from({ length: 21 }, () =>
        stepAwayFromCloseRecruiter(wanderer),
      );

      // 0.5 s at 5 tiles/s, 1 s at 2 tiles/s, then a new sprint.
      steps.slice(0, 5).forEach((step) => expect(step).toBeCloseTo(0.5));
      steps.slice(5, 15).forEach((step) => expect(step).toBeCloseTo(0.2));
      expect(steps[15]).toBeCloseTo(0.5);
    });

    /** Recruiters running straight at him at full speed, with the real tuning. */
    function chase(start: GridPosition, recruiters: GridPosition[]) {
      const wanderer = new DevWanderer(createWorldCollisions(), start, {
        speed: DEV_SPEED,
        fleeRadius: DEV_FLEE_RADIUS,
        sprint: DEV_SPRINT,
        maxTargetDistance: MAX_TARGET_DISTANCE,
        minPauseSeconds: 1,
        maxPauseSeconds: 1,
        random: scripted(0.5),
      });
      const tick = 0.05;
      let chasers = recruiters;

      for (let seconds = 0; seconds < 30; seconds += tick) {
        const dev = wanderer.update(tick, chasers);
        chasers = chasers.map((chaser) => {
          const gap = distance(chaser, dev);
          const step = Math.min(PLAYER_SPEED * tick, gap);

          return {
            column: chaser.column + ((dev.column - chaser.column) / gap) * step,
            row: chaser.row + ((dev.row - chaser.row) / gap) * step,
          };
        });

        if (chasers.some((chaser) => distance(chaser, dev) <= 0.8)) {
          return { caught: true, seconds, dev };
        }
      }

      return { caught: false, seconds: 30, dev: wanderer.position };
    }

    it("can't be run down in the open: a straight chase only catches him against a wall", () => {
      const result = chase({ column: 10, row: 10 }, [{ column: 7, row: 9.5 }]);

      expect(result.caught).toBe(true);
      // Pinned against the far edge of the map, not caught in the middle.
      expect(result.dev.column).toBeGreaterThan(19);
    });

    it("is caught faster when two recruiters close in from both sides", () => {
      const alone = chase({ column: 10, row: 14 }, [{ column: 7, row: 14 }]);
      const pincer = chase({ column: 10, row: 14 }, [
        { column: 7, row: 14 },
        { column: 13, row: 14.2 },
      ]);

      expect(pincer.caught).toBe(true);
      expect(pincer.seconds).toBeLessThan(alone.seconds);
    });
  });
});

function distance(from: GridPosition, to: GridPosition): number {
  return Math.hypot(to.column - from.column, to.row - from.row);
}
