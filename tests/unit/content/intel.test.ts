import { describe, expect, it } from "vitest";

import { INTEL_CARDS } from "../../../shared/intel";
import { DEV_PREFERENCES } from "../../../shared/preferences";
import { CV } from "../../../src/content/cv";
import {
  devExperiences,
  distinctMonths,
  intelCardText,
  leadExperiences,
} from "../../../src/content/intel";
import type { Experience } from "../../../src/domain/Experience";

const NOW = new Date("2026-10-10T00:00:00Z");

function experience(
  role: string,
  startDate: string,
  endDate?: string,
  company = "Acme",
  contract?: string,
): Experience {
  return {
    company,
    contract,
    role,
    startDate,
    endDate,
    highlights: [],
    technologies: [],
  };
}

// F-031
describe("intel card texts", () => {
  it("has a title and a text for every card", () => {
    for (const { id } of INTEL_CARDS) {
      const { title, text } = intelCardText(id, CV, NOW);

      expect(title, id).not.toBe("");
      expect(text, id).not.toBe("");
    }
  });

  it("names every technology of the preferred stack", () => {
    const { text } = intelCardText("stack", CV, NOW);

    for (const technology of DEV_PREFERENCES.stack) {
      expect(text).toContain(technology);
    }
  });

  it("matches the work-mode preferences", () => {
    expect(DEV_PREFERENCES.workMode).toEqual({
      perfect: ["remote"],
      accepted: ["hybrid"],
      fails: ["onsite"],
    });
    expect(intelCardText("work-mode", CV, NOW).text).toBe(
      "Télétravail idéal, hybride accepté, 5 jours sur site : refus",
    );
  });

  // F-074
  it("lists the diplomas and the languages from the CV", () => {
    expect(intelCardText("education", CV, NOW)).toEqual({
      title: "Formation & langues",
      text: "BTS, Informatique | option développement · Français, Anglais",
    });
  });

  // Dev: Locasun Apr 2012 → E-monsite Sep 2018 (78 months) + BoondManager Jul 2023 → now
  // (40). Lead: E-monsite Oct 2018 → PERI-G Jul 2023, back to back (58).
  it("adds up the dev and lead years from the CV", () => {
    expect(intelCardText("lead", CV, NOW)).toEqual({
      title: "Séniorité",
      text: "Dev : 9 ans 10 mois + Lead : 4 ans 10 mois",
    });
  });

  describe("leadExperiences", () => {
    it("keeps roles with 'Lead' in the title, oldest first", () => {
      const roles = leadExperiences([
        experience("Manager Lead Développeur", "2021-10", "2023-07"),
        experience("Développeur PHP", "2014-10", "2018-09"),
        experience("Lead Développeur PHP", "2018-10", "2019-07"),
        experience("Leader of nothing", "2010-01", "2011-01"),
      ]).map((role) => role.role);

      expect(roles).toEqual([
        "Lead Développeur PHP",
        "Manager Lead Développeur",
      ]);
    });
  });

  describe("devExperiences", () => {
    it("keeps the other roles, but not work-study ones", () => {
      const roles = devExperiences([
        experience("Lead Développeur PHP", "2018-10", "2019-07"),
        experience("Développeur PHP", "2012-04", "2014-05"),
        experience(
          "Webmaster",
          "2008-12",
          "2010-12",
          "EISTI",
          "Contrat en alternance",
        ),
      ]).map((role) => role.role);

      expect(roles).toEqual(["Développeur PHP"]);
    });
  });

  describe("distinctMonths", () => {
    it("counts both ends, like LinkedIn", () => {
      expect(
        distinctMonths([experience("Lead", "2023-07", "2023-07")], NOW),
      ).toBe(1);
    });

    it("counts a changeover month once", () => {
      expect(
        distinctMonths(
          [
            experience("Lead", "2018-10", "2019-07"),
            experience("Lead", "2019-07", "2021-10"),
          ],
          NOW,
        ),
      ).toBe(37);
    });

    it("leaves gaps out", () => {
      expect(
        distinctMonths(
          [
            experience("Lead", "2010-01", "2010-03"),
            experience("Lead", "2012-01", "2012-02"),
          ],
          NOW,
        ),
      ).toBe(5);
    });

    it("runs a current role up to now", () => {
      expect(distinctMonths([experience("Lead", "2026-01")], NOW)).toBe(10);
    });
  });
});
