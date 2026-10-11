// @vitest-environment happy-dom
import { Graphics, Text } from "pixi.js";
import { describe, expect, it } from "vitest";

import { DISTRICTS, districtLabelPosition } from "../../../../shared/districts";
import {
  DEFAULT_THEME,
  THEMES,
  type Theme,
} from "../../../../src/config/themes";
import { DistrictGround } from "../../../../src/game/entities/DistrictGround";
import { IsometricConverter } from "../../../../src/game/IsometricConverter";
import { drawnColours } from "../../../helpers/pixi";

const converter = new IsometricConverter(64, 32);
const [skillsPark] = DISTRICTS;

function parts(ground: DistrictGround) {
  const [outline] = ground.children.filter(
    (child) => child instanceof Graphics,
  );
  const [name] = ground.children.filter((child) => child instanceof Text);

  return { outline, name };
}

// F-005
describe("DistrictGround", () => {
  it("paints the district's name in capitals", () => {
    const ground = new DistrictGround(skillsPark, converter);

    expect(ground.labelText).toBe("SKILLS PARK");
  });

  it("writes the name at its label tile, along the column axis", () => {
    const { name } = parts(new DistrictGround(skillsPark, converter));
    const expected = converter.toScreen(districtLabelPosition(skillsPark));

    expect({ x: name.x, y: name.y }).toEqual(expected);
    expect(name.rotation).toBeCloseTo(Math.atan2(32, 64));
  });

  it("draws the outline and the name in the default theme's label colour", () => {
    const { outline, name } = parts(new DistrictGround(skillsPark, converter));

    expect(drawnColours(outline).stroke).toBe(DEFAULT_THEME.label);
    expect(name.style.fill).toBe(DEFAULT_THEME.label);
  });

  // F-050
  it.each(THEMES)("recolours both for the $name theme", (theme) => {
    const ground = new DistrictGround(skillsPark, converter);

    ground.applyTheme(theme);

    const { outline, name } = parts(ground);
    expect(drawnColours(outline).stroke).toBe(theme.label);
    expect(name.style.fill).toBe(theme.label);
  });

  it("switches to a different label colour without adding shapes", () => {
    const ground = new DistrictGround(skillsPark, converter);
    const theme: Theme = { ...DEFAULT_THEME, id: "test", label: 0xabcdef };

    ground.applyTheme(theme);
    ground.applyTheme(theme);

    const { outline, name } = parts(ground);
    expect(drawnColours(outline).stroke).toBe(0xabcdef);
    expect(name.style.fill).toBe(0xabcdef);
    expect(ground.children).toHaveLength(2);
  });
});
