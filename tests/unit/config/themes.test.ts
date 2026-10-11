import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, THEMES } from "../../../src/config/themes";

const isColour = (value: number) =>
  Number.isInteger(value) && value >= 0 && value <= 0xffffff;

/** WCAG relative luminance of a 0xRRGGBB colour. */
function luminance(colour: number): number {
  const [r, g, b] = [16, 8, 0].map((shift) => {
    const channel = ((colour >> shift) & 0xff) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, from 1 (none) to 21 (black on white). */
function contrastRatio(a: number, b: number): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// Content checks on the theme palettes.
describe("THEMES config", () => {
  it("offers Classic, Simpsons and South Park, in that order", () => {
    expect(THEMES.map((theme) => theme.name)).toEqual([
      "Classic",
      "Simpsons",
      "South Park",
    ]);
  });

  it("defaults to Classic, the game's original colours", () => {
    expect(DEFAULT_THEME).toMatchObject({
      id: "classic",
      background: 0x1f2937,
      tile: { fill: 0x8bcf8b, stroke: 0x4d8f4d },
    });
  });

  it("has unique ids", () => {
    const ids = THEMES.map((theme) => theme.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(THEMES)("$name uses valid 24-bit colours", (theme) => {
    for (const colour of [
      theme.background,
      theme.tile.fill,
      theme.tile.stroke,
      theme.label,
    ]) {
      expect(isColour(colour)).toBe(true);
    }
  });

  // Labels sit on the map tiles, so they must stay readable on the tile colour.
  it.each(THEMES)(
    "$name labels are readable on its tiles (contrast ≥ 4.5:1)",
    (theme) => {
      expect(
        contrastRatio(theme.label, theme.tile.fill),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(THEMES)("$name keeps tiles distinct from the background", (theme) => {
    expect(theme.tile.fill).not.toBe(theme.background);
    expect(theme.tile.stroke).not.toBe(theme.tile.fill);
  });
});
