// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { CV } from "../../../src/content/cv";
import type { Cv } from "../../../src/domain/Cv";
import { renderSection } from "../../../src/ui/cvSections";

const NOW = new Date(Date.UTC(2026, 9, 15));

const texts = (root: HTMLElement, selector: string) =>
  [...root.querySelectorAll(selector)].map((node) => node.textContent);

describe("renderSection('experience')", () => {
  const { title, body } = renderSection("experience", CV, NOW);

  it("is titled Expérience", () => {
    expect(title).toBe("Expérience");
  });

  it("shows the profile, then the experiences", () => {
    expect(texts(body, "h2")).toEqual(["Profil", "Expériences"]);
  });

  it("starts with the profile headline and summary", () => {
    expect(body.textContent).toContain(CV.profile.headline);
    for (const paragraph of CV.profile.summary) {
      expect(body.textContent).toContain(paragraph);
    }
  });

  it("lists every role, most recent first", () => {
    const roles = texts(body.querySelector(".cv-experiences")!, "h3");

    expect(roles).toEqual(CV.experiences.map((experience) => experience.role));
  });

  it("shows company, contract and work mode on one line", () => {
    const [current] = body.querySelectorAll(".cv-experiences .cv-entry");

    expect(current.querySelector(".cv-entry__meta")?.textContent).toBe(
      "BoondManager · CDI · À distance",
    );
  });

  it("shows the period with its duration", () => {
    const [current] = body.querySelectorAll(".cv-experiences .cv-entry");

    expect(current.querySelector(".cv-entry__period")?.textContent).toBe(
      "juil. 2023 – aujourd'hui · 3 ans 4 mois",
    );
  });

  it("lists highlights and technologies", () => {
    const [current] = body.querySelectorAll<HTMLElement>(
      ".cv-experiences .cv-entry",
    );
    const [boond] = CV.experiences;

    expect(texts(current, ".cv-entry__highlights li")).toEqual(
      boond.highlights,
    );
    expect(texts(current, ".cv-tags li")).toEqual(boond.technologies);
  });

  it("skips empty lists instead of rendering empty bullets", () => {
    const manager = [
      ...body.querySelectorAll(".cv-experiences .cv-entry"),
    ].find((entry) => entry.textContent.includes("Manager Lead Développeur"))!;

    expect(manager.querySelector("ul")).toBeNull();
  });
});

describe("renderSection('skills')", () => {
  const { title, body } = renderSection("skills", CV, NOW);

  it("is titled Compétences", () => {
    expect(title).toBe("Compétences");
  });

  it("groups skills by category, in CV order", () => {
    expect(texts(body, "h2")).toEqual([
      "Back-end",
      "Front-end",
      "Tests & CI/CD",
      "Méthodologies",
    ]);
  });

  it("shows every skill with an accessible level out of 5", () => {
    const skills = [...body.querySelectorAll(".cv-skill")];

    expect(skills).toHaveLength(CV.skills.length);
    const php = skills.find(
      (skill) => skill.querySelector(".cv-skill__name")?.textContent === "PHP",
    )!;
    const level = php.querySelector(".cv-level")!;
    expect(level.getAttribute("role")).toBe("img");
    expect(level.getAttribute("aria-label")).toBe("niveau 5 sur 5");
    expect(level.querySelectorAll(".cv-level__dot--filled")).toHaveLength(5);
  });

  it("draws a level as five same-sized dots, not glyphs that differ by font", () => {
    const laravel = [...body.querySelectorAll(".cv-skill")].find(
      (skill) =>
        skill.querySelector(".cv-skill__name")?.textContent === "Laravel",
    )!;
    const level = laravel.querySelector(".cv-level")!;

    expect(level.textContent).toBe("");
    expect(level.querySelectorAll(".cv-level__dot")).toHaveLength(5);
    expect(level.querySelectorAll(".cv-level__dot--filled")).toHaveLength(3);
  });
});

// F-005: the Education Campus building.
describe("renderSection('education')", () => {
  const { title, body } = renderSection("education", CV, NOW);

  it("is titled Formation et langues", () => {
    expect(title).toBe("Formation et langues");
  });

  it("shows the education, then the languages", () => {
    expect(texts(body, "h2")).toEqual(["Formation", "Langues"]);
  });

  it("lists every diploma with its school and period", () => {
    const education = body.querySelector(".cv-education")!;

    expect(education.textContent).toContain(CV.education[0].diploma);
    expect(education.textContent).toContain(CV.education[0].school);
    expect(education.textContent).toContain("2008 – 2010");
  });

  it("lists the languages with their level", () => {
    expect(texts(body, ".cv-languages__list li")).toEqual([
      "Français – Bilingue ou langue natale",
      "Anglais – Capacité professionnelle complète",
    ]);
  });
});

describe("rendering safety", () => {
  it("shows CV text as text, never as HTML", () => {
    const cv: Cv = {
      ...CV,
      experiences: [
        {
          company: "<img src=x onerror=alert(1)>",
          role: "<b>Dev</b>",
          startDate: "2020-01",
          highlights: [],
          technologies: [],
        },
      ],
    };

    const { body } = renderSection("experience", cv, NOW);

    expect(body.querySelector("img, b")).toBeNull();
    expect(body.textContent).toContain("<b>Dev</b>");
  });
});
