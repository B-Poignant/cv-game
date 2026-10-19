import { describe, expect, it } from "vitest";

import { shuffle } from "../../../../src/game/minigames/shuffle";

describe("shuffle", () => {
  it("keeps every item exactly once", () => {
    const items = [1, 2, 3, 4, 5];

    const shuffled = shuffle(items, Math.random);

    expect([...shuffled].sort()).toEqual(items);
  });

  it("returns a copy, leaving the original as it was", () => {
    const items = [1, 2, 3];

    const shuffled = shuffle(items, () => 0);

    expect(items).toEqual([1, 2, 3]);
    expect(shuffled).not.toBe(items);
  });

  it("follows the random source, so tests can seed it", () => {
    // random() = 0 swaps each item with the first one, from the end: [2, 3, 1].
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
    // Just under 1 swaps each item with itself.
    expect(shuffle([1, 2, 3], () => 0.999)).toEqual([1, 2, 3]);
  });
});
