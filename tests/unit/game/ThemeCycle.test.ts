import { describe, expect, it, vi } from "vitest";

import type { Theme } from "../../../src/config/themes";
import { ThemeCycle } from "../../../src/game/ThemeCycle";

function aTheme(id: string): Theme {
  return {
    id,
    name: id,
    background: 0,
    tile: { fill: 0, stroke: 0 },
    label: 0,
  };
}

const [A, B, C] = [aTheme("a"), aTheme("b"), aTheme("c")];

describe("ThemeCycle", () => {
  it("starts on the first theme", () => {
    expect(new ThemeCycle([A, B, C]).current).toBe(A);
  });

  it("moves through the themes in order and wraps around", () => {
    const themes = new ThemeCycle([A, B, C]);

    const visited = [themes.next(), themes.next(), themes.next()];

    expect(visited).toEqual([B, C, A]);
    expect(themes.current).toBe(A);
  });

  it("stays on the only theme when there is just one", () => {
    const themes = new ThemeCycle([A]);

    expect(themes.next()).toBe(A);
  });

  it("notifies listeners with the new theme", () => {
    const themes = new ThemeCycle([A, B]);
    const listener = vi.fn();
    themes.onChange(listener);

    themes.next();

    expect(listener).toHaveBeenCalledExactlyOnceWith(B);
  });

  it("stops notifying after unsubscribing", () => {
    const themes = new ThemeCycle([A, B]);
    const listener = vi.fn();
    const unsubscribe = themes.onChange(listener);

    unsubscribe();
    themes.next();

    expect(listener).not.toHaveBeenCalled();
  });

  it("refuses an empty list", () => {
    expect(() => new ThemeCycle([])).toThrow("at least one theme");
  });
});
