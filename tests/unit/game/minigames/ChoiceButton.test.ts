// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { THEMES } from "../../../../src/config/themes";
import { ChoiceButton } from "../../../../src/game/minigames/ChoiceButton";

function labelOf(button: ChoiceButton): Text {
  return button.children.find((child) => child instanceof Text) as Text;
}

// F-072, F-074
describe("ChoiceButton", () => {
  it("is an accessible button named after its text", () => {
    const button = new ChoiceButton("BTS", vi.fn());

    expect(button.accessible).toBe(true);
    expect(button.accessibleType).toBe("button");
    expect(button.accessibleHint).toBe("BTS");
  });

  it("calls back when tapped while open", () => {
    const onSelect = vi.fn();
    const button = new ChoiceButton("BTS", onSelect);

    button.emit("pointertap", undefined as never);

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("can't be picked again once marked", () => {
    const onSelect = vi.fn();
    const button = new ChoiceButton("BTS", onSelect);

    button.setMark("right");
    button.emit("pointertap", undefined as never);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it.each([
    { mark: "right", text: "✓ BTS" },
    { mark: "wrong", text: "✗ BTS" },
    { mark: "done", text: "BTS" },
  ] as const)(
    "shows a $mark mark with a symbol, not colour alone",
    ({ mark, text }) => {
      const button = new ChoiceButton("BTS", vi.fn());

      button.setMark(mark);

      expect(labelOf(button).text).toBe(text);
    },
  );

  it("writes in the theme's label colour", () => {
    const button = new ChoiceButton("BTS", vi.fn());

    button.applyTheme(THEMES[1]);

    expect(labelOf(button).style.fill).toBe(THEMES[1].label);
  });

  it("stops listening when destroyed", () => {
    const onSelect = vi.fn();
    const button = new ChoiceButton("BTS", onSelect);

    button.destroy();
    button.emit("pointertap", undefined as never);

    expect(onSelect).not.toHaveBeenCalled();
  });
});
