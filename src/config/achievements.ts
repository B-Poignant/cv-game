/** The badges a recruiter can earn (F-041), in the order they're listed. In English, like the UI. */
export const ACHIEVEMENTS = [
  {
    id: "hired",
    title: "Hired the dev",
    description: "Ben said yes to your pitch.",
  },
  {
    id: "read-cv",
    title: "Read the whole CV",
    description: "Opened every section of the CV.",
  },
  {
    id: "chest",
    title: "Found the chest",
    description: "Got the secret card from the hidden chest.",
  },
  {
    id: "speed-hire",
    title: "Hired in under 2 minutes",
    description: "From arrival to yes in less than 2 minutes.",
  },
  {
    id: "first-try",
    title: "Pitched like a pro",
    description: "Hired on your first pitch.",
  },
] as const satisfies readonly {
  id: string;
  title: string;
  description: string;
}[];

export type Achievement = (typeof ACHIEVEMENTS)[number];
export type AchievementId = Achievement["id"];

/** "Hired in under 2 minutes", in milliseconds. */
export const SPEED_HIRE_MS = 2 * 60 * 1000;
