import { describe, expect, it } from "vitest";

import { CV } from "../../../../../src/content/cv";
import {
  WORDS_TO_CATCH,
  WORDS_TO_DODGE,
} from "../../../../../src/game/minigames/buzzwordCatcher/items";

describe("buzzword catcher items", () => {
  it("the words to catch are all real CV skills", () => {
    const skills = CV.skills.map((skill) => skill.name);

    expect(WORDS_TO_CATCH.length).toBeGreaterThan(0);
    for (const word of WORDS_TO_CATCH) {
      expect(skills).toContain(word);
    }
  });

  it("the stacks the dev turns down are words to dodge", () => {
    expect(WORDS_TO_DODGE).toEqual(
      expect.arrayContaining(["Java", "Python", "COBOL"]),
    );
  });

  it("no word is both to catch and to dodge", () => {
    const overlap = WORDS_TO_DODGE.filter((word) =>
      WORDS_TO_CATCH.includes(word),
    );

    expect(overlap).toEqual([]);
  });

  it("no word to dodge is a CV skill", () => {
    const skills = CV.skills.map((skill) => skill.name);

    expect(WORDS_TO_DODGE.filter((word) => skills.includes(word))).toEqual([]);
  });
});
