import { describe, expect, it } from "vitest";

import { SpamStorm, type SpamTarget } from "../../../../server/rooms/SpamStorm";
import { SPAM } from "../../../../shared/spam";
import { MAP_SIZE } from "../../../../shared/world";

const TICK = 0.05;

/** random() values in order, then 0.99 (no more effect on the tests). */
function sequence(...values: number[]): () => number {
  return () => values.shift() ?? 0.99;
}

/** Runs `seconds` in server ticks, collecting every change. */
function run(storm: SpamStorm, seconds: number, targets: SpamTarget[]) {
  const slowed: string[] = [];
  const recovered: string[] = [];

  for (let time = 0; time < seconds - 1e-9; time += TICK) {
    const changes = storm.update(TICK, targets);
    slowed.push(...changes.slowed);
    recovered.push(...changes.recovered);
  }

  return { slowed, recovered };
}

const FAR_AWAY: SpamTarget = { id: "far", column: 12, row: 12 };

// F-063
describe("SpamStorm", () => {
  it("sends nothing before the first spawn, then one email", () => {
    const storm = new SpamStorm({ random: () => 0.5 });

    run(storm, SPAM.firstSpawnSeconds - TICK, [FAR_AWAY]);

    expect(storm.emails).toHaveLength(0);

    run(storm, TICK, [FAR_AWAY]);

    expect(storm.emails).toHaveLength(1);
  });

  it("sends nothing while nobody is in the room", () => {
    const storm = new SpamStorm({ random: () => 0.5 });

    run(storm, SPAM.firstSpawnSeconds + SPAM.spawnIntervalSeconds, []);

    expect(storm.emails).toHaveLength(0);
  });

  // random: target 0, along a row (< 0.5), from the left (< 0.5).
  it("flies along a recruiter's row, from just outside the map", () => {
    const storm = new SpamStorm({ random: sequence(0, 0.1, 0.1) });
    const target = { id: "a", column: 12, row: 7.4 };

    storm.update(SPAM.firstSpawnSeconds, [target]);

    const [email] = storm.emails;
    expect(email.row).toBe(7);
    expect(email.direction).toEqual({ column: 1, row: 0 });
    expect(email.column).toBeLessThan(0);
  });

  // random: target 0, along a column (≥ 0.5), from the bottom (≥ 0.5).
  it("can fly up a recruiter's column instead", () => {
    const storm = new SpamStorm({ random: sequence(0, 0.9, 0.9) });

    storm.update(SPAM.firstSpawnSeconds, [{ id: "a", column: 3, row: 12 }]);

    const [email] = storm.emails;
    expect(email.column).toBe(3);
    expect(email.direction).toEqual({ column: 0, row: -1 });
    expect(email.row).toBeGreaterThan(MAP_SIZE.rows - 1);
  });

  it("flies faster than recruiters walk, and leaves the map at the far edge", () => {
    const storm = new SpamStorm({ random: sequence(0, 0.1, 0.1) });
    const target = { id: "a", column: 12, row: 0 };
    storm.update(SPAM.firstSpawnSeconds, [target]);
    const start = storm.emails[0].column;

    storm.update(1, [{ ...target, row: 20 }]);

    expect(storm.emails[0].column - start).toBeCloseTo(SPAM.speed);

    storm.update(MAP_SIZE.columns / SPAM.speed, [{ ...target, row: 20 }]);

    expect(storm.emails).toHaveLength(0);
  });

  it(`never has more than ${String(SPAM.maxEmails)} emails flying`, () => {
    const storm = new SpamStorm({ random: () => 0.1 });
    // Off the map, so the emails aimed at its row never hit it and fly to the far edge.
    const outOfReach = { id: "a", column: MAP_SIZE.columns + 5, row: 5 };
    let most = 0;

    for (let time = 0; time < 60; time += TICK) {
      storm.update(TICK, [outOfReach]);
      most = Math.max(most, storm.emails.length);
    }

    expect(most).toBeGreaterThan(0);
    expect(most).toBeLessThanOrEqual(SPAM.maxEmails);
  });

  describe("hitting a recruiter", () => {
    /** An email on row 5 from the left, and a recruiter standing in its way. */
    function inTheWay() {
      const storm = new SpamStorm({ random: sequence(0, 0.1, 0.1) });
      const recruiter = { id: "homer", column: 2, row: 5 };
      const changes = run(storm, SPAM.firstSpawnSeconds + 2, [recruiter]);

      return { storm, recruiter, changes };
    }

    it("slows the recruiter down, and the email disappears", () => {
      const { storm, changes } = inTheWay();

      expect(changes.slowed).toEqual(["homer"]);
      expect(storm.isSlowed("homer")).toBe(true);
      expect(storm.emails).toHaveLength(0);
    });

    it("lets them recover after the slowdown", () => {
      const { storm, recruiter } = inTheWay();
      const away = { ...recruiter, row: 20 };

      const { recovered } = run(storm, SPAM.slowSeconds, [away]);

      expect(recovered).toEqual(["homer"]);
      expect(storm.isSlowed("homer")).toBe(false);
    });

    it("never hits a recruiter off its lane", () => {
      const storm = new SpamStorm({ random: sequence(0, 0.1, 0.1) });
      const recruiter = { id: "homer", column: 2, row: 5 };
      storm.update(SPAM.firstSpawnSeconds, [recruiter]);

      // Long enough for the email to cross the map, short of the next one.
      const { slowed } = run(storm, SPAM.spawnIntervalSeconds - 1, [
        { ...recruiter, row: 6 },
      ]);

      expect(slowed).toEqual([]);
    });

    it("forgets a recruiter who left", () => {
      const { storm } = inTheWay();

      storm.remove("homer");

      expect(storm.isSlowed("homer")).toBe(false);
    });
  });

  it("splits a long stall into short steps, so an email can't jump over a recruiter", () => {
    const storm = new SpamStorm({ random: sequence(0, 0.1, 0.1) });
    const recruiter = { id: "homer", column: 12, row: 5 };
    storm.update(SPAM.firstSpawnSeconds, [recruiter]);

    const { slowed } = storm.update(5, [recruiter]);

    expect(slowed).toEqual(["homer"]);
  });
});
