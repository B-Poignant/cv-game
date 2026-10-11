// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  THEMES,
  type Theme,
} from "../../../../src/config/themes";
import { Building } from "../../../../src/game/entities/Building";

function titleOf(building: Building): Text {
  const [title] = building.children.filter((child) => child instanceof Text);
  return title;
}

describe("Building", () => {
  it("draws its title in the default theme's label colour", () => {
    const building = new Building("SKILLS", { column: 0, row: 0 });

    expect(titleOf(building).style.fill).toBe(DEFAULT_THEME.label);
  });

  // F-050
  it.each(THEMES)("recolours its title for the $name theme", (theme) => {
    const building = new Building("SKILLS", { column: 0, row: 0 });

    building.applyTheme(theme);

    expect(titleOf(building).style.fill).toBe(theme.label);
  });

  it("switches its title to a different label colour", () => {
    const building = new Building("SKILLS", { column: 0, row: 0 });
    const theme: Theme = { ...DEFAULT_THEME, id: "test", label: 0xabcdef };

    building.applyTheme(theme);

    expect(titleOf(building).style.fill).toBe(0xabcdef);
  });

  it("draws one tile per cell of its footprint plus its title", () => {
    const building = new Building("SKILLS", { column: 0, row: 0 }, 3, 2);

    const labels = building.children.filter((child) => child instanceof Text);
    expect(labels.map((label) => label.text)).toEqual(["SKILLS"]);
    expect(building.children).toHaveLength(3 * 2 + 1);
  });

  it("defaults to a 2x2 footprint", () => {
    const building = new Building("X", { column: 0, row: 0 });

    expect(building.gridWidth).toBe(2);
    expect(building.gridHeight).toBe(2);
  });

  it("is clickable", () => {
    const building = new Building("X", { column: 0, row: 0 });

    expect(building.eventMode).toBe("static");
    expect(building.cursor).toBe("pointer");
  });

  it("is reachable with the keyboard as a named button", () => {
    const building = new Building("SKILLS", { column: 0, row: 0 });

    expect(building).toMatchObject({
      accessible: true,
      accessibleType: "button",
      accessibleTitle: "SKILLS",
      accessibleHint: "Open SKILLS",
    });
  });
});
