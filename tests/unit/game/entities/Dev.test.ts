// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, THEMES } from "../../../../src/config/themes";
import { Dev } from "../../../../src/game/entities/Dev";
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
});
