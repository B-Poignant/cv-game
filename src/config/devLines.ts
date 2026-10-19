/**
 * What Ben says in his speech bubbles (F-062), by situation. In English, one bubble each
 * (under about 60 characters), poking fun at recruiting clichés, never at people
 * (GAME_DESIGN.md › Tone).
 */
export const DEV_BUBBLE_LINES = {
  /** A recruiter came close: he's about to run. */
  close: [
    "Not open to work… unless it's remote.",
    "Is this about a rockstar ninja role? Bye!",
    "Quick call? I'm busy. Forever.",
    "No, I won't hop on a call.",
  ],
  /** Nobody around for a while. */
  idle: [
    "Just one more commit…",
    "Who wrote this code? Oh. Me.",
    "It works on my machine.",
  ],
} as const satisfies Record<string, readonly string[]>;

export type DevBubbleLines = Record<
  keyof typeof DEV_BUBBLE_LINES,
  readonly string[]
>;
