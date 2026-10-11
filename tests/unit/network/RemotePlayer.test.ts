// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { THEMES } from "../../../src/config/themes";

import { IsometricConverter } from "../../../src/game/IsometricConverter";
import { NameTag } from "../../../src/game/entities/NameTag";
import { RemotePlayer } from "../../../src/network/RemotePlayer";

const HOMER = { name: "Homer", company: "Springfield Nuclear" };

describe("RemotePlayer", () => {
  const converter = new IsometricConverter(64, 32);

  // F-012
  it("shows the visitor's name and company above the character", () => {
    const player = new RemotePlayer("abc123", HOMER, converter);
    const [tag] = player.children.filter((child) => child instanceof NameTag);

    expect(player.identity).toEqual(HOMER);
    expect(tag.y).toBeLessThan(0);
  });

  // F-012
  it("recolours its name tag with the theme", () => {
    const player = new RemotePlayer("abc123", HOMER, converter);
    const theme = THEMES[1];

    player.applyTheme(theme);

    const texts = player.children
      .filter((child) => child instanceof NameTag)
      .flatMap((tag) => tag.children.filter((child) => child instanceof Text));
    expect(texts.map((text) => text.style.fill)).toEqual([
      theme.label,
      theme.label,
    ]);
  });

  it("is drawn at the screen position of its grid tile", () => {
    const player = new RemotePlayer("abc123", HOMER, converter);

    player.setGridPosition({ column: 5, row: 3 });

    expect({ x: player.x, y: player.y }).toEqual({ x: 64, y: 128 });
  });

  // Called on every remote move: logging here floods the console.
  it("moves without logging", () => {
    const log = vi.spyOn(console, "log");
    const player = new RemotePlayer("abc123", HOMER, converter);

    player.setGridPosition({ column: 5, row: 3 });

    expect(log).not.toHaveBeenCalled();
  });
});
