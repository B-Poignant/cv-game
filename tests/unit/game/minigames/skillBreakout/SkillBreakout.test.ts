// @vitest-environment happy-dom
import { FederatedPointerEvent, Text, type EventBoundary } from "pixi.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { THEMES } from "../../../../../src/config/themes";
import { BREAKOUT_RULES } from "../../../../../src/game/minigames/skillBreakout/breakoutRules";
import {
  SKILL_BREAKOUT,
  SkillBreakout,
} from "../../../../../src/game/minigames/skillBreakout/SkillBreakout";
import { pressKey, releaseKey } from "../../../../helpers/keyboard";

// The field (400×300 units) is drawn 1.5× in a 600×514 play area: 64 px of HUD on top.
const CONTEXT = { width: 600, height: 514, theme: THEMES[0] };
const SKILLS = ["PHP", "React"];

function texts(game: SkillBreakout): Text[] {
  return game.view.children.flatMap((child) =>
    child instanceof Text ? [child] : (child.children as Text[]),
  );
}

describe("SkillBreakout", () => {
  const created: SkillBreakout[] = [];

  function createGame(random = () => 0.5) {
    const finish = vi.fn();
    const game = new SkillBreakout(CONTEXT, finish, SKILLS, random);
    created.push(game);
    return { game, finish };
  }

  /**
   * Plays frames until the game ends. With `follow`, the pointer keeps the paddle under the
   * ball, aiming a little to each side in turn so the ball reaches every brick.
   */
  function play(game: SkillBreakout, finish: () => void, follow: boolean) {
    for (let frame = 0; frame < 20000; frame += 1) {
      if (vi.mocked(finish).mock.calls.length > 0) {
        return;
      }
      if (follow) {
        const event = new FederatedPointerEvent({} as EventBoundary);
        event.global.set(1.5 * (game.ballX + 25 * Math.sin(frame / 40)), 300);
        game.view.emit("pointermove", event);
      }
      game.update(1 / 60);
    }
  }

  afterEach(() => {
    for (const game of created.splice(0)) {
      game.destroy();
    }
  });

  it("is the Skills Park minigame", () => {
    expect(SKILL_BREAKOUT.title).toBe("SKILLS PARK: SKILL BREAKOUT");
  });

  it("shows the skills to find, the balls left and how to play", () => {
    const { game } = createGame();

    const hud = texts(game)[0].text;
    expect(hud).toContain(
      `Skills 0/2  ·  Balls ${String(BREAKOUT_RULES.lives)}`,
    );
    expect(hud).toContain("Break the bricks that hold the dev's real skills");
  });

  it("writes a word on the skill bricks only, in the theme's label colour", () => {
    const { game } = createGame();
    game.update(0.016);

    const labels = texts(game).slice(1);
    expect(labels.map((label) => label.text).sort()).toEqual(["PHP", "React"]);
    for (const label of labels) {
      expect(label.style.fill).toBe(THEMES[0].label);
    }
  });

  it.each([
    { key: "ArrowRight", sign: 1 },
    { key: "d", sign: 1 },
    { key: "ArrowLeft", sign: -1 },
    { key: "q", sign: -1 },
    { key: "a", sign: -1 },
  ])("$key moves the paddle", ({ key, sign }) => {
    const { game } = createGame();

    pressKey(key);
    game.update(0.1);
    releaseKey(key);

    expect(Math.sign(game.paddleX - 200)).toBe(sign);
  });

  it("follows the pointer, converted to field units", () => {
    const { game } = createGame();
    const event = new FederatedPointerEvent({} as EventBoundary);
    event.global.set(1.5 * 220, 300);

    game.view.emit("pointermove", event);
    game.update(0.1);

    expect(game.paddleX).toBeCloseTo(220);
  });

  it("reports a win once the skill bricks are broken, and lists them", () => {
    const { game, finish } = createGame(() => 0.3);

    play(game, finish, true);

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: true });
    expect([...game.found].sort()).toEqual(["PHP", "React"]);
    expect(texts(game)[0].text).toMatch(/Found: (PHP, React|React, PHP)/);
  });

  it("reports a loss when every ball is lost", () => {
    // The paddle runs to the left edge and the ball is served to the right.
    const { game, finish } = createGame(() => 0.999);
    pressKey("ArrowLeft");

    play(game, finish, false);
    releaseKey("ArrowLeft");

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: false });
    expect(game.lives).toBe(0);
  });

  it("reports the end only once", () => {
    const { game, finish } = createGame(() => 0.999);
    pressKey("ArrowLeft");
    for (let frame = 0; frame < 20000; frame += 1) {
      game.update(1 / 60);
    }
    releaseKey("ArrowLeft");

    expect(finish).toHaveBeenCalledOnce();
  });

  it("follows a theme change", () => {
    const { game } = createGame();

    game.applyTheme(THEMES[1]);

    expect(texts(game)[0].style.fill).toBe(THEMES[1].label);
  });

  it("stops listening to the keyboard once destroyed", () => {
    const { game } = createGame();
    created.pop();
    const removed = vi.spyOn(window, "removeEventListener");

    game.destroy();

    expect(removed).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removed).toHaveBeenCalledWith("keyup", expect.any(Function));
    removed.mockRestore();
  });
});
