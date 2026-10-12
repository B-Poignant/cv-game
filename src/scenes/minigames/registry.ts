import { BUZZWORD_CATCHER } from "../../game/minigames/buzzwordCatcher/BuzzwordCatcher";
import type { MinigameRegistry } from "../MinigameFlow";

/**
 * The minigame each building runs (F-070). A building without one keeps the interim rule:
 * opening it up close gives its card (F-031).
 */
export const MINIGAMES: MinigameRegistry = {
  skills: BUZZWORD_CATCHER,
};
