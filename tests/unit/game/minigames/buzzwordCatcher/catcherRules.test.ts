import { describe, expect, it } from "vitest";

import {
  CATCHER_RULES,
  catcherOutcome,
  createCatcherState,
  isInBasket,
  stepCatcher,
  type CatcherState,
  type FallingWord,
} from "../../../../../src/game/minigames/buzzwordCatcher/catcherRules";

const POOLS = { catchable: ["PHP"], toDodge: ["Synergy"] };
const STILL = { direction: 0 } as const;

/** A random source that always returns `value`. */
const constant = (value: number) => () => value;

/** A state with no spawn due for a while, holding `words`. */
function stateWith(...words: FallingWord[]): CatcherState {
  return { ...createCatcherState(), words, nextSpawnIn: 100 };
}

function word(overrides: Partial<FallingWord> = {}): FallingWord {
  return {
    id: 1,
    word: "PHP",
    catchable: true,
    x: 0.5,
    y: CATCHER_RULES.basketY - 0.01,
    ...overrides,
  };
}

describe("catcherRules", () => {
  describe("createCatcherState", () => {
    it("starts centred, empty, at 0 with the full time", () => {
      const state = createCatcherState();

      expect(state).toMatchObject({
        basketX: 0.5,
        words: [],
        score: 0,
        timeLeft: CATCHER_RULES.durationSeconds,
      });
      expect(catcherOutcome(state)).toBe("playing");
    });
  });

  describe("spawning", () => {
    it("drops the first word on the first frame", () => {
      const state = createCatcherState();

      stepCatcher(state, 0.016, STILL, POOLS, constant(0));

      expect(state.words).toHaveLength(1);
      expect(state.words[0]).toMatchObject({ word: "PHP", catchable: true });
    });

    it("picks a word to dodge when the draw is above the catchable share", () => {
      const state = createCatcherState();

      stepCatcher(state, 0.016, STILL, POOLS, constant(0.99));

      expect(state.words[0]).toMatchObject({
        word: "Synergy",
        catchable: false,
      });
    });

    it("drops one word per interval, with distinct ids", () => {
      const state = createCatcherState();

      for (let frame = 0; frame < 30; frame += 1) {
        stepCatcher(state, 0.1, STILL, POOLS, constant(0));
      }

      // 3 s: one word at 0 s, then one every 0.9 s (the first has already landed).
      expect(state.nextId - 1).toBe(4);
      expect(state.words.map((w) => w.id)).toEqual([2, 3, 4]);
    });

    it.each([
      { draw: 0, x: CATCHER_RULES.sideMargin, label: "left" },
      { draw: 0.9999, x: 1 - CATCHER_RULES.sideMargin, label: "right" },
    ])("keeps words off the $label edge", ({ draw, x }) => {
      const state = createCatcherState();

      stepCatcher(state, 0.016, STILL, POOLS, constant(draw));

      expect(state.words[0].x).toBeCloseTo(x, 3);
    });
  });

  describe("the basket", () => {
    it.each([
      {
        direction: 1 as const,
        expected: 0.5 + CATCHER_RULES.basketSpeed * 0.1,
      },
      {
        direction: -1 as const,
        expected: 0.5 - CATCHER_RULES.basketSpeed * 0.1,
      },
    ])(
      "moves at basketSpeed with direction $direction",
      ({ direction, expected }) => {
        const state = stateWith();

        stepCatcher(state, 0.1, { direction }, POOLS);

        expect(state.basketX).toBeCloseTo(expected);
      },
    );

    it("stays inside the play area", () => {
      const state = stateWith();

      for (let frame = 0; frame < 50; frame += 1) {
        stepCatcher(state, 0.1, { direction: 1 }, POOLS);
      }

      expect(state.basketX).toBeCloseTo(1 - CATCHER_RULES.basketWidth / 2);
    });

    it("heads for the pointer without overshooting it", () => {
      const state = stateWith();

      stepCatcher(state, 0.1, { direction: 0, targetX: 0.52 }, POOLS);

      expect(state.basketX).toBeCloseTo(0.52);
    });

    it("moves no faster towards the pointer than with the keys", () => {
      const state = stateWith();

      stepCatcher(state, 0.1, { direction: 0, targetX: 0.9 }, POOLS);

      expect(state.basketX).toBeCloseTo(0.5 + CATCHER_RULES.basketSpeed * 0.1);
    });

    it.each([
      { x: 0.5, inside: true, label: "centre" },
      { x: 0.5 + CATCHER_RULES.basketWidth / 2, inside: true, label: "edge" },
      {
        x: 0.5 + CATCHER_RULES.basketWidth / 2 + 0.01,
        inside: false,
        label: "just outside",
      },
    ])("a word at the $label is in the basket: $inside", ({ x, inside }) => {
      expect(isInBasket(x, 0.5)).toBe(inside);
    });
  });

  describe("scoring", () => {
    it("a word of the stack caught in the basket scores", () => {
      const state = stateWith(word());

      const events = stepCatcher(state, 0.1, STILL, POOLS);

      expect(events).toEqual([
        expect.objectContaining({
          caught: true,
          points: CATCHER_RULES.pointsPerCatch,
        }),
      ]);
      expect(state.score).toBe(CATCHER_RULES.pointsPerCatch);
      expect(state.words).toEqual([]);
    });

    it("a word to dodge caught in the basket costs points", () => {
      const state = stateWith(word({ catchable: false, word: "Synergy" }));
      state.score = 5;

      const events = stepCatcher(state, 0.1, STILL, POOLS);

      expect(events[0]).toMatchObject({
        caught: true,
        points: -CATCHER_RULES.pointsPerMistake,
      });
      expect(state.score).toBe(5 - CATCHER_RULES.pointsPerMistake);
    });

    it("the score never goes below 0", () => {
      const state = stateWith(word({ catchable: false }));

      stepCatcher(state, 0.1, STILL, POOLS);

      expect(state.score).toBe(0);
    });

    it("a missed word changes nothing and disappears", () => {
      const state = stateWith(word({ x: 0.1 }));

      const events = stepCatcher(state, 0.1, STILL, POOLS);

      expect(events).toEqual([
        expect.objectContaining({ caught: false, points: 0 }),
      ]);
      expect(state.score).toBe(0);
      expect(state.words).toEqual([]);
    });

    it("words above the basket keep falling", () => {
      const state = stateWith(word({ y: 0.2 }));

      const events = stepCatcher(state, 0.1, STILL, POOLS);

      expect(events).toEqual([]);
      expect(state.words[0].y).toBeCloseTo(0.2 + CATCHER_RULES.fallSpeed * 0.1);
    });
  });

  describe("the outcome", () => {
    it("is a win as soon as the target score is reached", () => {
      const state = stateWith(word());
      state.score = CATCHER_RULES.targetScore - 1;

      stepCatcher(state, 0.1, STILL, POOLS);

      expect(catcherOutcome(state)).toBe("won");
    });

    it("is a loss when time runs out below the target", () => {
      const state = stateWith();
      const frames =
        CATCHER_RULES.durationSeconds / CATCHER_RULES.maxFrameSeconds;

      for (let frame = 0; frame <= frames; frame += 1) {
        stepCatcher(state, 1, STILL, POOLS);
      }

      expect(state.timeLeft).toBe(0);
      expect(catcherOutcome(state)).toBe("lost");
    });

    it("caps long frames so a hidden tab doesn't skip the game", () => {
      const state = stateWith();

      stepCatcher(state, 10, STILL, POOLS);

      expect(state.timeLeft).toBeCloseTo(
        CATCHER_RULES.durationSeconds - CATCHER_RULES.maxFrameSeconds,
      );
    });

    it("nothing moves once the game is over", () => {
      const state = stateWith(word({ y: 0.2 }));
      state.timeLeft = 0;

      const events = stepCatcher(state, 0.1, { direction: 1 }, POOLS);

      expect(events).toEqual([]);
      expect(state.basketX).toBe(0.5);
      expect(state.words[0].y).toBe(0.2);
    });

    it("a perfect player can reach the target in time", () => {
      const state = createCatcherState();

      // Always catchable, always in the middle: the basket never needs to move.
      for (let frame = 0; catcherOutcome(state) === "playing"; frame += 1) {
        stepCatcher(state, 0.1, STILL, POOLS, constant(0.45));
      }

      expect(catcherOutcome(state)).toBe("won");
      expect(state.timeLeft).toBeGreaterThan(0);
    });
  });
});
