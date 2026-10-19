import { BUILDINGS, type CvSectionId } from "../../shared/buildings";
import {
  formatPeriod,
  formatWorkMode,
  formatDuration,
  monthsBetween,
} from "../content/format";
import type { Contact } from "../domain/Contact";
import type { Cv } from "../domain/Cv";
import type { Experience } from "../domain/Experience";
import type { Skill } from "../domain/Skill";
import { type Html, tag } from "./html";

const MAX_LEVEL = 5;

/** A section's accent: its building's colour on the map, so the page echoes the game. */
export function sectionColour(section: CvSectionId): string {
  const building = BUILDINGS.find((candidate) => candidate.section === section);

  return `#${(building?.color ?? 0x64748b).toString(16).padStart(6, "0")}`;
}

/** A titled section, with a little isometric tile in its district's colour. */
export function section(
  id: string,
  title: string,
  accent: CvSectionId | undefined,
  ...body: Html[]
): Html {
  return tag(
    "section",
    {
      class: "section",
      "aria-labelledby": `${id}-title`,
      style: accent ? `--accent: ${sectionColour(accent)}` : undefined,
    },
    tag(
      "h2",
      { id: `${id}-title`, class: "section__title" },
      tag("span", { class: "tile", "aria-hidden": "true" }),
      title,
    ),
    ...body,
  );
}

export function renderContact(contact: Contact): Html {
  return tag(
    "ul",
    { class: "contact" },
    contact.email &&
      tag(
        "li",
        {},
        tag("a", { href: `mailto:${contact.email}` }, contact.email),
      ),
    contact.linkedin &&
      tag("li", {}, tag("a", { href: contact.linkedin }, "LinkedIn")),
    contact.cvPdf &&
      tag(
        "li",
        { class: "screen-only" },
        tag("a", { href: contact.cvPdf, download: "" }, "CV en PDF"),
      ),
  );
}

/** Consecutive roles at the same company, most recent first: a promotion reads as one stay. */
export function groupByCompany(
  experiences: readonly Experience[],
): Experience[][] {
  const groups: Experience[][] = [];

  for (const experience of experiences) {
    const last = groups.at(-1);

    if (last && last[0].company === experience.company) {
      last.push(experience);
    } else {
      groups.push([experience]);
    }
  }

  return groups;
}

export function renderExperiences(cv: Cv, now: Date): Html {
  return tag(
    "ol",
    { class: "timeline" },
    groupByCompany(cv.experiences).map((roles) => {
      const oldest = roles[roles.length - 1];
      const months = monthsBetween(oldest.startDate, roles[0].endDate, now);

      return tag(
        "li",
        { class: "timeline__company" },
        tag(
          "h3",
          { class: "company" },
          roles[0].company,
          roles.length > 1 &&
            tag("span", { class: "company__total" }, formatDuration(months)),
        ),
        tag(
          "ol",
          { class: "roles" },
          roles.map((role) => renderRole(role, now)),
        ),
      );
    }),
  );
}

function renderRole(experience: Experience, now: Date): Html {
  const meta = [
    experience.location,
    experience.workMode && formatWorkMode(experience.workMode),
    experience.contract,
  ].filter((part): part is string => Boolean(part));

  return tag(
    "li",
    { class: "role" },
    tag("h4", { class: "role__title" }, experience.role),
    tag(
      "p",
      { class: "role__period" },
      formatPeriod(experience.startDate, experience.endDate, now),
    ),
    meta.length > 0 && tag("p", { class: "role__meta" }, meta.join(" · ")),
    experience.description &&
      tag("p", { class: "role__description" }, experience.description),
    experience.highlights.length > 0 &&
      tag(
        "ul",
        { class: "role__highlights" },
        experience.highlights.map((highlight) => tag("li", {}, highlight)),
      ),
    experience.technologies.length > 0 &&
      tag(
        "ul",
        { class: "tags", "aria-label": "Technologies" },
        experience.technologies.map((technology) => tag("li", {}, technology)),
      ),
  );
}

export function renderSkills(cv: Cv): Html[] {
  const categories = [...new Set(cv.skills.map((skill) => skill.category))];

  return categories.map((category) =>
    tag(
      "div",
      { class: "skills" },
      tag("h3", { class: "skills__category" }, category),
      tag(
        "ul",
        { class: "skills__list" },
        cv.skills
          .filter((skill) => skill.category === category)
          .map((skill) => renderSkill(skill)),
      ),
    ),
  );
}

/** The level as tiles, like the game's skill dots (F-030), and as text for screen readers. */
function renderSkill(skill: Skill): Html {
  const level = Math.max(0, Math.min(MAX_LEVEL, Math.round(skill.level)));

  return tag(
    "li",
    { class: "skill" },
    tag("span", { class: "skill__name" }, skill.name),
    tag(
      "span",
      {
        class: "level",
        role: "img",
        "aria-label": `Niveau ${String(level)} sur ${String(MAX_LEVEL)}`,
      },
      Array.from({ length: MAX_LEVEL }, (_, index) =>
        tag("span", {
          class: index < level ? "level__tile level__tile--on" : "level__tile",
        }),
      ),
    ),
  );
}

export function renderEducation(cv: Cv): Html {
  return tag(
    "ul",
    { class: "plain-list" },
    cv.education.map((education) =>
      tag(
        "li",
        {},
        tag("strong", {}, education.diploma),
        tag("span", {}, education.school),
        tag(
          "span",
          { class: "muted" },
          [education.startDate, education.endDate]
            .filter((year): year is string => Boolean(year))
            .join(" – "),
        ),
      ),
    ),
  );
}

export function renderLanguages(cv: Cv): Html {
  return tag(
    "ul",
    { class: "plain-list" },
    cv.languages.map((language) =>
      tag(
        "li",
        {},
        tag("strong", {}, language.name),
        tag("span", { class: "muted" }, language.level),
      ),
    ),
  );
}

export function renderProjects(cv: Cv): Html {
  return tag(
    "ul",
    { class: "plain-list" },
    cv.projects.map((project) =>
      tag(
        "li",
        {},
        tag(
          "strong",
          {},
          project.url
            ? tag("a", { href: project.url }, project.name)
            : project.name,
        ),
        tag("span", {}, project.description),
        tag("span", { class: "muted" }, project.technologies.join(" · ")),
      ),
    ),
  );
}

/** `"19 octobre 2026"`, for the "updated on" line. */
export function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
