// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, THEMES } from "../../../../src/config/themes";
import { NameTag } from "../../../../src/game/entities/NameTag";

const HOMER = { name: "Homer", company: "Springfield Nuclear" };

function linesOf(tag: NameTag): Text[] {
  return tag.children.filter((child) => child instanceof Text);
}

// F-012
describe("NameTag", () => {
  it("shows the name with the company underneath", () => {
    const [name, company] = linesOf(new NameTag(HOMER));

    expect([name.text, company.text]).toEqual(["Homer", "Springfield Nuclear"]);
    expect(name.y).toBeLessThan(company.y);
    expect(new NameTag(HOMER).identity).toEqual(HOMER);
  });

  it("starts in the default theme's label colour", () => {
    for (const line of linesOf(new NameTag(HOMER))) {
      expect(line.style.fill).toBe(DEFAULT_THEME.label);
    }
  });

  it.each(THEMES)("recolours both lines for the $name theme", (theme) => {
    const tag = new NameTag(HOMER);

    tag.applyTheme(theme);

    for (const line of linesOf(tag)) {
      expect(line.style.fill).toBe(theme.label);
    }
  });
});
