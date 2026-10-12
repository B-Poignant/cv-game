// @vitest-environment happy-dom
import { FederatedPointerEvent, Text, type EventBoundary } from "pixi.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { THEMES } from "../../../../../src/config/themes";
import {
  BUZZWORD_CATCHER,
  BuzzwordCatcher,
} from "../../../../../src/game/minigames/buzzwordCatcher/BuzzwordCatcher";
import { CATCHER_RULES } from "../../../../../src/game/minigames/buzzwordCatcher/catcherRules";
import { pressKey, releaseKey } from "../../../../helpers/keyboard";

const CONTEXT = { width: 600, height: 400, theme: THEMES[0] };
const POOLS = { catchable: ["PHP"], toDodge: ["Synergy"] };

function texts(catcher: BuzzwordCatcher): string[] {
  return catcher.view.children.flatMap((child) =>
    child instanceof Text
      ? [child.text]
      : child.children.map((c) => (c as Text).text),
  );
}

describe("BuzzwordCatcher", () => {
  const created: BuzzwordCatcher[] = [];

  /** Words always catchable and dropped in the middle, where the basket starts. */
  function createCatcher(random = () => 0.45) {
    const finish = vi.fn();
    const catcher = new BuzzwordCatcher(CONTEXT, finish, POOLS, random);
    created.push(catcher);
    return { catcher, finish };
  }

  afterEach(() => {
    for (const catcher of created.splice(0)) {
      catcher.destroy();
    }
  });

  it("is the Skills Park minigame", () => {
    expect(BUZZWORD_CATCHER.title).toBe("SKILLS PARK: BUZZWORD CATCHER");
  });

  it("shows the score, the time and how to play", () => {
    const { catcher } = createCatcher();

    expect(texts(catcher).join("\n")).toMatch(
      new RegExp(`Score 0/${String(CATCHER_RULES.targetScore)}.*40 s`),
    );
    expect(texts(catcher).join("\n")).toContain("Catch the dev's stack");
  });

  it("draws falling words in the theme's label colour", () => {
    const { catcher } = createCatcher();

    catcher.update(0.016);

    const word = catcher.view.children
      .flatMap((child) => child.children)
      .find((child) => child instanceof Text && child.text === "PHP") as Text;
    expect(word).toBeDefined();
    expect(word.style.fill).toBe(THEMES[0].label);
  });

  it.each([
    { key: "ArrowRight", sign: 1 },
    { key: "d", sign: 1 },
    { key: "ArrowLeft", sign: -1 },
    { key: "q", sign: -1 },
    { key: "a", sign: -1 },
  ])("$key moves the basket", ({ key, sign }) => {
    const { catcher } = createCatcher();

    pressKey(key);
    catcher.update(0.1);
    releaseKey(key);

    expect(Math.sign(catcher.basketX - 0.5)).toBe(sign);
  });

  it("stops moving when the key is released", () => {
    const { catcher } = createCatcher();
    pressKey("ArrowRight");
    catcher.update(0.1);
    releaseKey("ArrowRight");
    const position = catcher.basketX;

    catcher.update(0.1);

    expect(catcher.basketX).toBe(position);
  });

  it("follows the pointer", () => {
    const { catcher } = createCatcher();
    const event = new FederatedPointerEvent({} as EventBoundary);
    event.global.set(0.6 * CONTEXT.width, 100);

    catcher.view.emit("pointermove", event);
    catcher.update(0.1);

    expect(catcher.basketX).toBeCloseTo(0.6);
  });

  it("reports a win once the target score is reached", () => {
    const { catcher, finish } = createCatcher();

    for (
      let frame = 0;
      frame < 1000 && finish.mock.calls.length === 0;
      frame += 1
    ) {
      catcher.update(0.1);
    }

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: true });
    expect(catcher.score).toBe(CATCHER_RULES.targetScore);
  });

  it("reports a loss when time runs out", () => {
    // Every word drops at the far left, out of the basket's reach.
    const { catcher, finish } = createCatcher(() => 0);

    for (
      let frame = 0;
      frame < 1000 && finish.mock.calls.length === 0;
      frame += 1
    ) {
      catcher.update(0.1);
    }

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: false });
  });

  it("reports the end only once", () => {
    const { catcher, finish } = createCatcher(() => 0);
    for (let frame = 0; frame < 1000; frame += 1) {
      catcher.update(0.1);
    }

    expect(finish).toHaveBeenCalledOnce();
  });

  it("follows a theme change", () => {
    const { catcher } = createCatcher();
    catcher.update(0.016);

    catcher.applyTheme(THEMES[1]);

    const hud = catcher.view.children.find(
      (child) => child instanceof Text,
    ) as Text;
    expect(hud.style.fill).toBe(THEMES[1].label);
  });

  it("stops listening to the keyboard once destroyed", () => {
    const { catcher } = createCatcher();
    created.pop();
    const removed = vi.spyOn(window, "removeEventListener");

    catcher.destroy();

    expect(removed).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removed).toHaveBeenCalledWith("keyup", expect.any(Function));
    removed.mockRestore();
  });
});
