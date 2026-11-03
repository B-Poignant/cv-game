import type { Cv } from "../../domain/Cv";
import { SKILL_BREAKOUT } from "../../game/minigames/skillBreakout/SkillBreakout";
import { careerTimeline } from "../../game/minigames/careerTimeline/CareerTimeline";
import { educationQuiz } from "../../game/minigames/educationQuiz/EducationQuiz";
import type { MinigameRegistry } from "../MinigameFlow";

/**
 * The minigame each building runs (F-070), built from the CV `Game` passes in. A building
 * without one keeps the interim rule: opening it up close gives its card (F-031).
 */
export function createMinigames(cv: Cv): MinigameRegistry {
  return {
    skills: SKILL_BREAKOUT,
    experience: careerTimeline(cv),
    education: educationQuiz(cv),
  };
}
