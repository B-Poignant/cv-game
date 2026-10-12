import { formatPeriod, formatWorkMode } from "../content/format";
import type { Cv, CvSectionId } from "../domain/Cv";
import type { Experience } from "../domain/Experience";

// Renders CV sections as HTML. Content goes in through textContent only (never innerHTML),
// so CV text can't inject markup.

export interface RenderedSection {
  /** Section title, in French like the content. */
  title: string;
  body: HTMLElement;
}

type Child = Node | string | null | undefined | false;

function el(
  tag: string,
  className: string | null,
  ...children: Child[]
): HTMLElement {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  for (const child of children) {
    if (child) {
      element.append(child);
    }
  }
  return element;
}

function list(className: string, items: string[]): HTMLElement | null {
  return items.length > 0
    ? el("ul", className, ...items.map((item) => el("li", null, item)))
    : null;
}

function renderExperience(experience: Experience, now: Date): HTMLElement {
  const meta = [
    experience.company,
    experience.contract,
    experience.workMode && formatWorkMode(experience.workMode),
  ].filter(Boolean);

  return el(
    "article",
    "cv-entry",
    el("h3", "cv-entry__title", experience.role),
    el("p", "cv-entry__meta", meta.join(" · ")),
    el(
      "p",
      "cv-entry__period",
      formatPeriod(experience.startDate, experience.endDate, now),
    ),
    experience.location && el("p", "cv-entry__location", experience.location),
    experience.description &&
      el("p", "cv-entry__description", experience.description),
    list("cv-entry__highlights", experience.highlights),
    list("cv-tags", experience.technologies),
  );
}

function renderExperienceSection(cv: Cv, now: Date): HTMLElement {
  return el(
    "div",
    "cv-section",
    el(
      "section",
      "cv-profile",
      el("h2", null, "Profil"),
      el("p", "cv-profile__headline", cv.profile.headline),
      ...cv.profile.summary.map((paragraph) => el("p", null, paragraph)),
    ),
    el(
      "section",
      "cv-experiences",
      el("h2", null, "Expériences"),
      ...cv.experiences.map((experience) => renderExperience(experience, now)),
    ),
  );
}

function renderSkillsSection(cv: Cv): HTMLElement {
  const categories = [...new Set(cv.skills.map((skill) => skill.category))];

  return el(
    "div",
    "cv-section",
    ...categories.map((category) =>
      el(
        "section",
        "cv-skills",
        el("h2", null, category),
        el(
          "ul",
          "cv-skills__list",
          ...cv.skills
            .filter((skill) => skill.category === category)
            .map((skill) => {
              // CSS dots, not ●/○: fonts draw those two glyphs at different sizes.
              const level = el(
                "span",
                "cv-level",
                ...Array.from({ length: 5 }, (_, index) =>
                  el(
                    "span",
                    index < skill.level
                      ? "cv-level__dot cv-level__dot--filled"
                      : "cv-level__dot",
                  ),
                ),
              );
              level.setAttribute("role", "img");
              level.setAttribute("aria-label", `niveau ${skill.level} sur 5`);
              level.dataset.level = String(skill.level);

              return el(
                "li",
                "cv-skill",
                el("span", "cv-skill__name", skill.name),
                level,
              );
            }),
        ),
      ),
    ),
  );
}

function renderEducationSection(cv: Cv): HTMLElement {
  return el(
    "div",
    "cv-section",
    el(
      "section",
      "cv-education",
      el("h2", null, "Formation"),
      ...cv.education.map((education) =>
        el(
          "article",
          "cv-entry",
          el("h3", "cv-entry__title", education.diploma),
          el("p", "cv-entry__meta", education.school),
          el(
            "p",
            "cv-entry__period",
            education.endDate
              ? `${education.startDate} – ${education.endDate}`
              : education.startDate,
          ),
        ),
      ),
    ),
    el(
      "section",
      "cv-languages",
      el("h2", null, "Langues"),
      el(
        "ul",
        "cv-languages__list",
        ...cv.languages.map((language) =>
          el(
            "li",
            null,
            el("strong", null, language.name),
            ` – ${language.level}`,
          ),
        ),
      ),
    ),
  );
}

export function renderSection(
  section: CvSectionId,
  cv: Cv,
  now: Date = new Date(),
): RenderedSection {
  switch (section) {
    case "experience":
      return { title: "Expérience", body: renderExperienceSection(cv, now) };
    case "skills":
      return { title: "Compétences", body: renderSkillsSection(cv) };
    case "education":
      return {
        title: "Formation et langues",
        body: renderEducationSection(cv),
      };
  }
}
