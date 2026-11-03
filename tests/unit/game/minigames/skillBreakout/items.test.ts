import { describe, expect, it } from "vitest";

import { CV } from "../../../../../src/content/cv";
import { SKILL_WORDS } from "../../../../../src/game/minigames/skillBreakout/items";

describe("skill breakout items", () => {
  it("the skill words are all real CV skills", () => {
    const skills = CV.skills.map((skill) => skill.name);

    expect(SKILL_WORDS.length).toBeGreaterThan(0);
    for (const word of SKILL_WORDS) {
      expect(skills).toContain(word);
    }
  });
});
