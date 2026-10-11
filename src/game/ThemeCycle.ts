import type { Theme } from "../config/themes";

export type ThemeListener = (theme: Theme) => void;

/** Holds the current theme and moves to the next one in order, wrapping around. */
export class ThemeCycle {
  private readonly themes: readonly Theme[];
  private readonly listeners = new Set<ThemeListener>();
  private index = 0;

  constructor(themes: readonly Theme[]) {
    if (themes.length === 0) {
      throw new Error("ThemeCycle needs at least one theme");
    }

    this.themes = themes;
  }

  public get current(): Theme {
    return this.themes[this.index];
  }

  public next(): Theme {
    this.index = (this.index + 1) % this.themes.length;

    for (const listener of this.listeners) {
      listener(this.current);
    }

    return this.current;
  }

  /** Calls `listener` on every theme change. Returns a function that unsubscribes. */
  public onChange(listener: ThemeListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}
