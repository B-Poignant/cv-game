import { describe, expect, it } from "vitest";

import { DEV_PREFERENCES } from "../../../shared/preferences";
import { CV } from "../../../src/content/cv";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR_OR_MONTH = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

// Content checks: catch typos and inconsistencies in the real CV data (F-030).
describe("CV content", () => {
  describe("profile", () => {
    it("has a name, a headline and a summary", () => {
      expect(CV.profile.name).toBe("Ben");
      expect(CV.profile.headline).not.toBe("");
      expect(CV.profile.summary.length).toBeGreaterThan(0);
    });
  });

  describe("experiences", () => {
    it.each(CV.experiences)(
      "$role at $company has valid YYYY-MM dates in order",
      (experience) => {
        expect(experience.startDate).toMatch(MONTH);
        if (experience.endDate !== undefined) {
          expect(experience.endDate).toMatch(MONTH);
          expect(experience.endDate >= experience.startDate).toBe(true);
        }
      },
    );

    it("are listed most recent first", () => {
      const starts = CV.experiences.map((experience) => experience.startDate);

      expect(starts).toEqual([...starts].sort().reverse());
    });

    it("have exactly one current job: BoondManager, remote", () => {
      const current = CV.experiences.filter(
        (experience) => !experience.endDate,
      );

      expect(current).toHaveLength(1);
      expect(current[0]).toMatchObject({
        company: "BoondManager",
        workMode: "remote",
      });
    });

    it("do not overlap (one job at a time)", () => {
      const [, ...older] = CV.experiences;

      older.forEach((experience, index) => {
        const newer = CV.experiences[index];
        expect(
          experience.endDate! <= newer.startDate,
          `${experience.company} ends after ${newer.company} starts`,
        ).toBe(true);
      });
    });

    it.each(CV.experiences)(
      "$role at $company has no empty text",
      (experience) => {
        expect(experience.company.trim()).not.toBe("");
        expect(experience.role.trim()).not.toBe("");
        for (const line of [
          ...experience.highlights,
          ...experience.technologies,
        ]) {
          expect(line.trim()).not.toBe("");
        }
      },
    );
  });

  describe("education", () => {
    it.each(CV.education)("$diploma has valid dates in order", (education) => {
      expect(education.startDate).toMatch(YEAR_OR_MONTH);
      if (education.endDate !== undefined) {
        expect(education.endDate).toMatch(YEAR_OR_MONTH);
        expect(education.endDate >= education.startDate).toBe(true);
      }
    });
  });

  describe("skills", () => {
    it("have unique names", () => {
      const names = CV.skills.map((skill) => skill.name);

      expect(new Set(names).size).toBe(names.length);
    });

    it.each(CV.skills)("$name has a level from 1 to 5", (skill) => {
      expect(Number.isInteger(skill.level)).toBe(true);
      expect(skill.level).toBeGreaterThanOrEqual(1);
      expect(skill.level).toBeLessThanOrEqual(5);
    });

    // The pitch (F-042) rewards this stack, so the CV must back it up.
    it.each(DEV_PREFERENCES.stack)(
      "include the preferred technology %s",
      (name) => {
        expect(CV.skills.map((skill) => skill.name)).toContain(name);
      },
    );
  });

  it("lists French and English", () => {
    expect(CV.languages.map((language) => language.name)).toEqual([
      "Français",
      "Anglais",
    ]);
  });
});
