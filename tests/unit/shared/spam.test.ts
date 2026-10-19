import { describe, expect, it } from "vitest";

import { SPAM, SPAM_SUBJECTS, spamSubject } from "../../../shared/spam";
import { DEV_SPEED, PLAYER_SPEED } from "../../../shared/world";

// F-063
describe("spam hazard rules", () => {
  it("gives every email a subject, the same for every visitor", () => {
    expect(spamSubject(1)).toBe(SPAM_SUBJECTS[1]);
    expect(spamSubject(SPAM_SUBJECTS.length)).toBe(SPAM_SUBJECTS[0]);
    expect(spamSubject(-2)).toBe(SPAM_SUBJECTS[2]);
  });

  it("keeps every subject to one short line (GAME_DESIGN.md › Tone)", () => {
    for (const subject of SPAM_SUBJECTS) {
      expect(subject.length, subject).toBeLessThanOrEqual(30);
    }
  });

  // Mild, as the owner chose: a nuisance, not a wall.
  it("flies faster than recruiters walk, and slows them for a short while only", () => {
    expect(SPAM.speed).toBeGreaterThan(PLAYER_SPEED);
    expect(SPAM.slowFactor).toBeGreaterThan(0);
    expect(SPAM.slowFactor).toBeLessThan(1);
    expect(SPAM.slowSeconds).toBeLessThanOrEqual(2);
    expect(SPAM.maxEmails).toBeLessThanOrEqual(2);
  });

  // Ben runs at DEV_SPEED: a slowed recruiter loses ground for a moment, then catches up.
  it("leaves a slowed recruiter slower than Ben, so a hit costs a chase", () => {
    expect(PLAYER_SPEED * SPAM.slowFactor).toBeLessThan(DEV_SPEED);
  });
});
