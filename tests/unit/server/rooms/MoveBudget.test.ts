import { describe, expect, it } from "vitest";

import { MoveBudget } from "../../../../server/rooms/MoveBudget";

// 1 tile of budget, refilled at 4 tiles per second.
const CAPACITY = 1;
const RATE = 4;

function createBudget() {
  return new MoveBudget(CAPACITY, RATE, 0);
}

describe("MoveBudget", () => {
  it("starts full: a first move of up to one tile is accepted", () => {
    expect(createBudget().tryMove(1, 0)).toBe(true);
  });

  it("rejects a move larger than what is left", () => {
    const budget = createBudget();
    budget.tryMove(0.8, 0);

    expect(budget.tryMove(0.5, 0)).toBe(false);
  });

  it("doesn't spend anything on a rejected move", () => {
    const budget = createBudget();
    budget.tryMove(0.75, 0);
    budget.tryMove(0.5, 0);

    expect(budget.tryMove(0.25, 0)).toBe(true);
  });

  it("refills at its rate over time", () => {
    const budget = createBudget();
    budget.tryMove(1, 0);

    expect(budget.tryMove(0.5, 100)).toBe(false); // +0.4 tiles
    expect(budget.tryMove(0.5, 150)).toBe(true); // +0.6 tiles
  });

  it("never stores more than its capacity", () => {
    const budget = createBudget();

    expect(budget.tryMove(0.9, 10_000)).toBe(true);
    expect(budget.tryMove(0.9, 10_000)).toBe(false);
  });

  it("accepts a client moving at the allowed speed, frame after frame", () => {
    const budget = createBudget();
    const step = 3 / 60; // 3 tiles per second at 60 fps

    for (let frame = 1; frame <= 600; frame += 1) {
      expect(budget.tryMove(step, (frame * 1000) / 60)).toBe(true);
    }
  });

  it("stops a client moving twice as fast as the refill rate", () => {
    const budget = createBudget();
    const step = (2 * RATE) / 60;
    let accepted = 0;

    for (let frame = 1; frame <= 600; frame += 1) {
      if (budget.tryMove(step, (frame * 1000) / 60)) {
        accepted += step;
      }
    }

    // 10 seconds: at most the starting budget plus 10 s × RATE.
    expect(accepted).toBeLessThanOrEqual(CAPACITY + 10 * RATE + step);
  });
});
