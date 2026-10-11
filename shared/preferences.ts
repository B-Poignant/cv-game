export type WorkMode = "remote" | "hybrid" | "onsite";

/** The roles a recruiter can offer in a pitch (F-042). */
export type RoleId =
  | "lead-full-stack"
  | "tech-lead"
  | "engineering-manager"
  | "full-stack"
  | "back-end-php"
  | "front-end"
  | "game-dev"
  | "rockstar-ninja";

type Ratings<T> = Record<"perfect" | "accepted" | "fails", readonly T[]>;

/**
 * The dev's real job preferences (GAME_DESIGN.md › "The pitch"), as answered by the CV owner.
 * The server scores pitches against these (F-042), so they live in shared code.
 */
export const DEV_PREFERENCES = {
  /** Any of these makes the stack part of a pitch perfect. Must exist in the CV skills. */
  stack: [
    "PHP",
    "Symfony",
    "Laravel",
    "JavaScript",
    "TypeScript",
    "Vue.js",
    "Ember.js",
    "React",
  ],
  workMode: {
    perfect: ["remote"],
    accepted: ["hybrid"],
    fails: ["onsite"],
  },
  role: {
    perfect: ["lead-full-stack", "tech-lead", "engineering-manager"],
    accepted: ["full-stack", "back-end-php", "front-end"],
    fails: ["game-dev", "rockstar-ninja"],
  },
} as const satisfies {
  stack: readonly string[];
  workMode: Ratings<WorkMode>;
  role: Ratings<RoleId>;
};
