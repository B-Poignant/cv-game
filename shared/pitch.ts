import { DEV_PREFERENCES, type RoleId, type WorkMode } from "./preferences";

// The pitch (F-042): what a recruiter can offer, and how the dev answers.
// The server scores offers; the client only shows the options and the answer.

/** A recruiter closer than this to the dev, in tiles, has caught him. */
export const CATCH_DISTANCE = 0.8;

/** After a bad pitch, how long before the same recruiter can pitch again. */
export const PITCH_COOLDOWN_SECONDS = 30;

export type Rating = "perfect" | "accepted" | "fails";

export const STACK_OPTIONS = [
  {
    id: "java",
    label: "Java (Spring)",
    technologies: ["Java", "Spring"],
    reply: "Java? Not my stack. Read the CV!",
  },
  {
    id: "php",
    label: "PHP (Symfony, Laravel)",
    technologies: ["PHP", "Symfony", "Laravel"],
    reply: "",
  },
  {
    id: "python",
    label: "Python (Django)",
    technologies: ["Python", "Django"],
    reply: "Python? Not my stack. Read the CV!",
  },
  {
    id: "typescript",
    label: "TypeScript (React, Vue.js)",
    technologies: ["TypeScript", "React", "Vue.js"],
    reply: "",
  },
  {
    id: "cobol",
    label: "COBOL",
    technologies: ["COBOL"],
    reply: "COBOL? I said PHP or TypeScript. Read the CV!",
  },
] as const;

export const WORK_MODE_OPTIONS = [
  {
    id: "onsite",
    label: "Onsite, 5 days a week",
    reply: "5 days in the office? I'll pass.",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    reply: "Hybrid… fine, if the coffee is good.",
  },
  { id: "remote", label: "Full remote", reply: "" },
] as const satisfies readonly { id: WorkMode; label: string; reply: string }[];

export const ROLE_OPTIONS = [
  {
    id: "rockstar-ninja",
    label: "Rockstar ninja 10x",
    reply: "Rockstar ninja? I'll pass.",
  },
  {
    id: "full-stack",
    label: "Full stack developer",
    reply: "No lead role? Fine… I guess.",
  },
  { id: "tech-lead", label: "Tech lead", reply: "" },
  {
    id: "back-end-php",
    label: "Back-end PHP developer",
    reply: "Only back-end? I like the front too.",
  },
  { id: "engineering-manager", label: "Engineering manager", reply: "" },
  {
    id: "game-dev",
    label: "Game developer",
    reply: "Games? Fun, but not my CV. Read it again!",
  },
  {
    id: "front-end",
    label: "Front-end developer",
    reply: "Only front-end? I like the back too.",
  },
  { id: "lead-full-stack", label: "Lead full stack developer", reply: "" },
] as const satisfies readonly { id: RoleId; label: string; reply: string }[];

/** Openers: one sincere, two recruiting clichés (GAME_DESIGN.md › Tone). */
export const LINE_OPTIONS = [
  {
    id: "quick-call",
    label: "Hi! Open to a quick call?",
    rating: "fails",
    reply: "A quick call is never quick. Bye!",
  },
  {
    id: "read-cv",
    label: "I read your CV, and this job fits it.",
    rating: "perfect",
    reply: "",
  },
  {
    id: "perfect-fit",
    label: "You're a perfect fit for our fast-paced team!",
    rating: "fails",
    reply: "Every offer says I'm a perfect fit.",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  rating: Rating;
  reply: string;
}[];

export const DEV_LINES = {
  hired: "…OK. You actually read it. You got me.",
  noIntel: "Do you even know what I do?",
  cooldown: (seconds: number) => `Not again! Give me ${seconds} s.`,
  /** An offer sent after the pitch dialog timed out (F-042). */
  tooSlow: "Too slow, I left.",
};

export interface PitchOffer {
  stack: (typeof STACK_OPTIONS)[number]["id"];
  workMode: WorkMode;
  role: RoleId;
  line: (typeof LINE_OPTIONS)[number]["id"];
}

export type PitchCategory = keyof PitchOffer;

/** What the dev decides, and what he says (one bubble per line). */
export interface PitchResult {
  hired: boolean;
  lines: string[];
}

/** What the server tells a recruiter about their pitch (the "pitch" message). */
export type PitchEvent =
  | { type: "open" }
  | { type: "refused"; line: string }
  | ({ type: "result" } & PitchResult);

export function isPitchOffer(value: unknown): value is PitchOffer {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const offer = value as Record<string, unknown>;

  return (
    STACK_OPTIONS.some((option) => option.id === offer.stack) &&
    WORK_MODE_OPTIONS.some((option) => option.id === offer.workMode) &&
    ROLE_OPTIONS.some((option) => option.id === offer.role) &&
    LINE_OPTIONS.some((option) => option.id === offer.line)
  );
}

/** How the dev rates one part of an offer, from his real preferences. */
export function rate(offer: PitchOffer, category: PitchCategory): Rating {
  switch (category) {
    case "stack": {
      const option = optionFor(offer, "stack");
      const preferred: readonly string[] = DEV_PREFERENCES.stack;

      return option.technologies.some((technology) =>
        preferred.includes(technology),
      )
        ? "perfect"
        : "fails";
    }
    case "workMode":
      return ratingIn(DEV_PREFERENCES.workMode, offer.workMode);
    case "role":
      return ratingIn(DEV_PREFERENCES.role, offer.role);
    case "line":
      return optionFor(offer, "line").rating;
  }
}

/** Checked in this order: the first part that fails is the one the dev complains about. */
const CATEGORIES: readonly PitchCategory[] = [
  "workMode",
  "stack",
  "role",
  "line",
];

/**
 * Scores an offer: any part that fails ends the pitch with the dev saying why. Otherwise
 * he's hired, after a grumble about each part that's only accepted.
 */
export function scorePitch(offer: PitchOffer): PitchResult {
  const failed = CATEGORIES.find(
    (category) => rate(offer, category) === "fails",
  );

  if (failed) {
    return { hired: false, lines: [optionFor(offer, failed).reply] };
  }

  const grumbles = CATEGORIES.filter(
    (category) => rate(offer, category) === "accepted",
  ).map((category) => optionFor(offer, category).reply);

  return { hired: true, lines: [...grumbles, DEV_LINES.hired] };
}

const OPTIONS = {
  stack: STACK_OPTIONS,
  workMode: WORK_MODE_OPTIONS,
  role: ROLE_OPTIONS,
  line: LINE_OPTIONS,
};

function optionFor<C extends PitchCategory>(
  offer: PitchOffer,
  category: C,
): (typeof OPTIONS)[C][number] {
  const options: readonly { id: string }[] = OPTIONS[category];
  const option = options.find((candidate) => candidate.id === offer[category]);

  if (!option) {
    throw new Error(`Unknown ${category} option: ${offer[category]}`);
  }

  return option as (typeof OPTIONS)[C][number];
}

function ratingIn<T>(ratings: Record<Rating, readonly T[]>, value: T): Rating {
  if (ratings.perfect.includes(value)) {
    return "perfect";
  }

  return ratings.accepted.includes(value) ? "accepted" : "fails";
}
