import { describe, expect, it } from "vitest";

import {
  BREAKOUT_RULES,
  breakoutOutcome,
  createBreakoutState,
  skillCount,
  skillsFound,
  stepBreakout,
  type BreakoutState,
  type Brick,
} from "../../../../../src/game/minigames/skillBreakout/breakoutRules";

const SKILLS = ["PHP", "React"];
const STILL = { direction: 0 } as const;
const { field, paddle, ballRadius } = BREAKOUT_RULES;

/** A random source that always returns `value` (0.5 serves the ball straight up). */
const constant = (value: number) => () => value;

/** A game with the ball in play at (x, y), moving at (vx, vy). */
function inPlay(
  ball: { x: number; y: number; vx: number; vy: number },
  bricks?: Brick[],
): BreakoutState {
  const state = createBreakoutState(SKILLS, constant(0.5));

  state.serveIn = 0;
  state.ball = { ...ball };
  if (bricks) {
    state.bricks = bricks;
  }
  return state;
}

function brick(overrides: Partial<Brick> = {}): Brick {
  return {
    id: 1,
    word: "PHP",
    skill: true,
    x: 100,
    y: 100,
    width: 60,
    height: 20,
    broken: false,
    ...overrides,
  };
}

/** A skill brick far out of the ball's way, so the game doesn't end on its own. */
const farSkill = () => brick({ id: 99, x: 0, y: 0, width: 1, height: 1 });

describe("breakoutRules", () => {
  describe("createBreakoutState", () => {
    it("fills the wall with every skill and empty bricks for the rest", () => {
      const state = createBreakoutState(SKILLS, constant(0));
      const cells = BREAKOUT_RULES.columns * BREAKOUT_RULES.rows;

      expect(state.bricks).toHaveLength(cells);
      expect(skillCount(state)).toBe(2);
      expect(
        state.bricks
          .filter((b) => b.skill)
          .map((b) => b.word)
          .sort(),
      ).toEqual(["PHP", "React"]);
      expect(
        new Set(state.bricks.filter((b) => !b.skill).map((b) => b.word)),
      ).toEqual(new Set([""]));
    });

    it("keeps every brick inside the field without overlaps", () => {
      const state = createBreakoutState(SKILLS, Math.random);

      for (const b of state.bricks) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(field.width + 1e-9);
        expect(b.y + b.height).toBeLessThan(paddle.y);
      }
      const corners = new Set(
        state.bricks.map((b) => `${String(b.x)},${String(b.y)}`),
      );
      expect(corners.size).toBe(state.bricks.length);
    });

    it("shuffles where the skills are", () => {
      const positions = (random: () => number) =>
        createBreakoutState(SKILLS, random)
          .bricks.filter((b) => b.skill)
          .map((b) => b.id);

      expect(positions(constant(0))).not.toEqual(positions(constant(0.99)));
    });

    it("starts with the ball resting on the centred paddle, all lives left", () => {
      const state = createBreakoutState(SKILLS);

      expect(state.paddleX).toBe(field.width / 2);
      expect(state.ball).toMatchObject({ x: field.width / 2, vx: 0, vy: 0 });
      expect(state.serveIn).toBe(BREAKOUT_RULES.serveDelaySeconds);
      expect(state.lives).toBe(BREAKOUT_RULES.lives);
      expect(breakoutOutcome(state)).toBe("playing");
    });
  });

  describe("serving", () => {
    it("the resting ball follows the paddle", () => {
      const state = createBreakoutState(SKILLS);

      stepBreakout(state, 0.1, { direction: 1 });

      expect(state.ball.x).toBe(state.paddleX);
      expect(state.ball.vy).toBe(0);
    });

    it("the ball leaves upwards at full speed once the delay is over", () => {
      const state = createBreakoutState(SKILLS);

      for (let frame = 0; frame < 11; frame += 1) {
        stepBreakout(state, 0.1, STILL, constant(0.9999));
      }

      expect(state.serveIn).toBe(0);
      expect(state.ball.vy).toBeLessThan(0);
      expect(Math.hypot(state.ball.vx, state.ball.vy)).toBeCloseTo(
        BREAKOUT_RULES.ballSpeed,
      );
      expect(Math.atan2(state.ball.vx, -state.ball.vy)).toBeCloseTo(
        BREAKOUT_RULES.maxServeAngle,
      );
    });
  });

  describe("the paddle", () => {
    it.each([
      { direction: 1 as const, expected: 200 + paddle.speed * 0.1 },
      { direction: -1 as const, expected: 200 - paddle.speed * 0.1 },
    ])(
      "moves at its speed with direction $direction",
      ({ direction, expected }) => {
        const state = createBreakoutState(SKILLS);

        stepBreakout(state, 0.1, { direction });

        expect(state.paddleX).toBeCloseTo(expected);
      },
    );

    it("stays inside the field", () => {
      const state = createBreakoutState(SKILLS);

      for (let frame = 0; frame < 20; frame += 1) {
        stepBreakout(state, 0.1, { direction: 1 });
      }

      expect(state.paddleX).toBeCloseTo(field.width - paddle.width / 2);
    });

    it("heads for the pointer, no faster than with the keys", () => {
      const near = createBreakoutState(SKILLS);
      const far = createBreakoutState(SKILLS);

      stepBreakout(near, 0.1, { direction: 0, targetX: 210 });
      stepBreakout(far, 0.1, { direction: 0, targetX: 400 });

      expect(near.paddleX).toBeCloseTo(210);
      expect(far.paddleX).toBeCloseTo(200 + paddle.speed * 0.1);
    });
  });

  describe("bounces", () => {
    it("off the side and top walls", () => {
      const side = inPlay({ x: ballRadius + 1, y: 200, vx: -200, vy: -10 }, [
        farSkill(),
      ]);
      const top = inPlay({ x: 200, y: ballRadius + 1, vx: 10, vy: -200 }, [
        farSkill(),
      ]);

      stepBreakout(side, 0.05, STILL);
      stepBreakout(top, 0.05, STILL);

      expect(side.ball.vx).toBeGreaterThan(0);
      expect(top.ball.vy).toBeGreaterThan(0);
    });

    it("straight up off the paddle's centre", () => {
      const state = inPlay(
        { x: 200, y: paddle.y - ballRadius - 1, vx: 0, vy: 200 },
        [farSkill()],
      );

      stepBreakout(state, 0.02, STILL);

      expect(state.ball.vy).toBeCloseTo(-state.speed);
      expect(state.ball.vx).toBeCloseTo(0);
    });

    it("wider off the paddle's edge", () => {
      const state = inPlay(
        {
          x: 200 + paddle.width / 2,
          y: paddle.y - ballRadius - 1,
          vx: 0,
          vy: 200,
        },
        [farSkill()],
      );

      stepBreakout(state, 0.02, STILL);

      expect(Math.atan2(state.ball.vx, -state.ball.vy)).toBeCloseTo(
        BREAKOUT_RULES.maxBounceAngle,
      );
    });
  });

  describe("bricks", () => {
    it("a brick hit from below breaks and sends the ball back down", () => {
      const target = brick();
      const state = inPlay({ x: 130, y: 126, vx: 0, vy: -200 }, [
        target,
        farSkill(),
      ]);

      const events = stepBreakout(state, 0.05, STILL);

      expect(events).toEqual([{ type: "brick", brick: target }]);
      expect(target.broken).toBe(true);
      expect(state.ball.vy).toBeGreaterThan(0);
    });

    it("a brick hit from the side sends the ball sideways", () => {
      const target = brick();
      const state = inPlay({ x: 94, y: 110, vx: 200, vy: -20 }, [
        target,
        farSkill(),
      ]);

      stepBreakout(state, 0.05, STILL);

      expect(target.broken).toBe(true);
      expect(state.ball.vx).toBeLessThan(0);
    });

    it("the ball can't pass through a brick in one long frame", () => {
      const target = brick({ height: 4 });
      // Without sub-steps, it would jump from y 112 to 82, over the brick (100 to 104).
      const state = inPlay({ x: 130, y: 112, vx: 0, vy: -300 }, [
        target,
        farSkill(),
      ]);

      stepBreakout(state, BREAKOUT_RULES.maxFrameSeconds, STILL);

      expect(target.broken).toBe(true);
    });

    it("breaking an empty brick speeds the ball up, a skill doesn't", () => {
      const empty = inPlay({ x: 130, y: 126, vx: 0, vy: -200 }, [
        brick({ skill: false, word: "" }),
        farSkill(),
      ]);
      const skill = inPlay({ x: 130, y: 126, vx: 0, vy: -200 }, [
        brick(),
        farSkill(),
      ]);

      stepBreakout(empty, 0.05, STILL);
      stepBreakout(skill, 0.05, STILL);

      expect(empty.speed).toBeCloseTo(
        BREAKOUT_RULES.ballSpeed * (1 + BREAKOUT_RULES.emptyBrickSpeedUp),
      );
      expect(skill.speed).toBe(BREAKOUT_RULES.ballSpeed);
    });

    it("the ball never gets faster than its cap", () => {
      const state = inPlay({ x: 130, y: 126, vx: 0, vy: -200 }, [
        brick({ skill: false }),
        farSkill(),
      ]);
      state.speed = BREAKOUT_RULES.maxBallSpeed;

      stepBreakout(state, 0.05, STILL);

      expect(state.speed).toBe(BREAKOUT_RULES.maxBallSpeed);
    });

    it("lists the skills found in the order of the wall", () => {
      const state = inPlay({ x: 200, y: 200, vx: 0, vy: 0 }, [
        brick({ id: 1, word: "React", broken: true }),
        brick({ id: 2, word: "", skill: false, broken: true }),
        brick({ id: 3, word: "PHP", broken: true }),
        brick({ id: 4, word: "Vue.js" }),
      ]);

      expect(skillsFound(state)).toEqual(["React", "PHP"]);
    });
  });

  describe("the outcome", () => {
    it("is a win once every skill brick is broken, empty ones left or not", () => {
      const last = brick();
      const state = inPlay({ x: 130, y: 126, vx: 0, vy: -200 }, [
        last,
        brick({ id: 2, skill: false, x: 300 }),
      ]);

      stepBreakout(state, 0.05, STILL);

      expect(breakoutOutcome(state)).toBe("won");
    });

    it("a ball falling past the paddle costs a life and is served again", () => {
      const state = inPlay(
        { x: 20, y: field.height + ballRadius - 1, vx: 0, vy: 200 },
        [farSkill()],
      );

      const events = stepBreakout(state, 0.05, STILL);

      expect(events).toEqual([
        { type: "ball-lost", livesLeft: BREAKOUT_RULES.lives - 1 },
      ]);
      expect(state.lives).toBe(BREAKOUT_RULES.lives - 1);
      expect(state.serveIn).toBe(BREAKOUT_RULES.serveDelaySeconds);
      expect(breakoutOutcome(state)).toBe("playing");
    });

    it("is a loss when the last ball falls", () => {
      const state = inPlay(
        { x: 20, y: field.height + ballRadius - 1, vx: 0, vy: 200 },
        [farSkill()],
      );
      state.lives = 1;

      stepBreakout(state, 0.05, STILL);

      expect(breakoutOutcome(state)).toBe("lost");
    });

    it("caps long frames so a hidden tab doesn't skip the game", () => {
      const state = createBreakoutState(SKILLS);

      stepBreakout(state, 10, STILL);

      expect(state.serveIn).toBeCloseTo(
        BREAKOUT_RULES.serveDelaySeconds - BREAKOUT_RULES.maxFrameSeconds,
      );
    });

    it("nothing moves once the game is over", () => {
      const state = inPlay({ x: 200, y: 200, vx: 0, vy: -200 }, [farSkill()]);
      state.lives = 0;

      const events = stepBreakout(state, 0.1, { direction: 1 });

      expect(events).toEqual([]);
      expect(state.paddleX).toBe(field.width / 2);
      expect(state.ball.y).toBe(200);
    });

    it("a player who keeps the paddle under the ball wins", () => {
      const state = createBreakoutState(SKILLS, constant(0.3));

      for (
        let frame = 0;
        frame < 20000 && breakoutOutcome(state) === "playing";
        frame += 1
      ) {
        stepBreakout(
          state,
          1 / 60,
          // Aims a little to each side in turn, so the ball reaches every brick.
          { direction: 0, targetX: state.ball.x + 25 * Math.sin(frame / 40) },
          constant(0.3),
        );
      }

      expect(breakoutOutcome(state)).toBe("won");
      expect(state.lives).toBe(BREAKOUT_RULES.lives);
    });
  });
});
