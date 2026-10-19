// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, THEMES } from "../../../../src/config/themes";
import { BUBBLE_SECONDS, Dev } from "../../../../src/game/entities/Dev";
import { IsometricConverter } from "../../../../src/game/IsometricConverter";

const converter = new IsometricConverter(64, 32);

function nameOf(dev: Dev): Text {
  const [label] = dev.children.filter((child) => child instanceof Text);
  return label;
}

// F-060
describe("Dev", () => {
  it("shows his name above him, in the default theme's label colour", () => {
    const dev = new Dev("Ben", converter);

    expect(nameOf(dev).text).toBe("Ben");
    expect(nameOf(dev).y).toBeLessThan(0);
    expect(nameOf(dev).style.fill).toBe(DEFAULT_THEME.label);
  });

  it.each(THEMES)("recolours his name for the $name theme", (theme) => {
    const dev = new Dev("Ben", converter);

    dev.applyTheme(theme);

    expect(nameOf(dev).style.fill).toBe(theme.label);
  });

  it("is drawn on the screen position of his tile", () => {
    const dev = new Dev("Ben", converter);

    dev.setGridPosition({ column: 3, row: 7 });

    expect({ x: dev.x, y: dev.y }).toEqual(
      converter.toScreen({ column: 3, row: 7 }),
    );
  });

  // F-062
  describe("speech bubble", () => {
    it("has none until he speaks", () => {
      const dev = new Dev("Ben", converter);

      expect(dev.speech).toBeUndefined();
    });

    it("shows what he says, then hides it after a while", () => {
      const dev = new Dev("Ben", converter);

      dev.say("Just one more commit…");
      dev.update(BUBBLE_SECONDS / 2);

      expect(dev.speech).toBe("Just one more commit…");

      dev.update(BUBBLE_SECONDS / 2);

      expect(dev.speech).toBeUndefined();
    });

    it("keeps a new line up for the full time", () => {
      const dev = new Dev("Ben", converter);
      dev.say("First");
      dev.update(BUBBLE_SECONDS - 0.1);

      dev.say("Second");
      dev.update(BUBBLE_SECONDS - 0.1);

      expect(dev.speech).toBe("Second");
    });
  });
});
