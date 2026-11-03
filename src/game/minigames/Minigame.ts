import type { Container } from "pixi.js";

import type { Theme } from "../../config/themes";

/** How a minigame ended (F-070). Quitting counts as a loss. */
export interface MinigameResult {
  won: boolean;
}

/** Size of the play area in pixels, and the theme to draw it with. */
export interface MinigameContext {
  width: number;
  height: number;
  theme: Theme;
}

/**
 * A short game a building runs before its CV panel opens (F-070). It draws into `view`
 * (the play area's top-left corner is its origin), reads its own input, and reports the end
 * through the `finish` callback it was created with. The host removes and destroys it.
 */
export interface Minigame {
  readonly view: Container;
  /** Advances one frame lasting `deltaSeconds`. */
  update(deltaSeconds: number): void;
  /** The play area changed size (the window was resized). */
  resize?(width: number, height: number): void;
  applyTheme?(theme: Theme): void;
  /** Removes its listeners. Called once, after it finished or when the game closes. */
  destroy(): void;
}

export interface MinigameDefinition {
  /** Shown above the play area, e.g. "SKILLS PARK: SKILL BREAKOUT". */
  title: string;
  create(
    context: MinigameContext,
    finish: (result: MinigameResult) => void,
  ): Minigame;
}
