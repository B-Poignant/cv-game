import type { Contact } from "../domain/Contact";
import type { Cv } from "../domain/Cv";
import {
  formatDay,
  renderContact,
  renderEducation,
  renderExperiences,
  renderLanguages,
  renderProjects,
  renderSkills,
  section,
  sectionColour,
} from "./cvPageSections";
import { CV_PAGE_STYLES } from "./cvPageStyles";
import { type Html, join, raw, tag } from "./html";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap";

export interface CvPageOptions {
  /** Where the game is, for the "play" link. */
  gameUrl: string;
  /** Shown in the footer as the update date. */
  now: Date;
}

/**
 * The CV as a classic, standalone HTML page (F-032), in French like the CV, built from the
 * same `cv.ts` and `contact.ts` as the game so they never disagree. Every text is escaped.
 * Written by `npm run cv:html` and served at /cv.
 */
export function renderCvPage(
  cv: Cv,
  contact: Contact,
  options: CvPageOptions,
): string {
  const { profile } = cv;
  const description = profile.summary[0] ?? profile.headline;

  return `<!doctype html>\n${join([
    tag(
      "html",
      { lang: "fr" },
      tag(
        "head",
        {},
        raw('<meta charset="utf-8">'),
        raw(
          '<meta name="viewport" content="width=device-width, initial-scale=1">',
        ),
        tag("title", {}, `${profile.name} · ${profile.headline}`),
        tag("meta", { name: "description", content: description }),
        raw('<link rel="icon" href="/favicon.svg" type="image/svg+xml">'),
        raw('<link rel="preconnect" href="https://fonts.googleapis.com">'),
        raw(
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        ),
        tag("link", { rel: "stylesheet", href: FONTS }),
        tag("style", {}, raw(CV_PAGE_STYLES)),
      ),
      tag(
        "body",
        {},
        tag(
          "div",
          { class: "page" },
          renderMasthead(cv, contact),
          tag(
            "p",
            { class: "play" },
            tag(
              "span",
              {},
              "Ce CV existe aussi en jeu : retrouvez Ben sur sa carte.",
            ),
            tag("a", { href: options.gameUrl }, "Jouer à Headhunted →"),
          ),
          tag(
            "div",
            { class: "layout" },
            tag("aside", { class: "sidebar" }, ...renderSidebar(cv)),
            tag("main", { class: "main" }, ...renderMain(cv, options.now)),
          ),
          tag(
            "footer",
            { class: "footer" },
            `Mis à jour le ${formatDay(options.now)}.`,
          ),
        ),
      ),
    ),
  ])}\n`;
}

function renderMasthead(cv: Cv, contact: Contact): Html {
  return tag(
    "header",
    { class: "masthead" },
    tag(
      "div",
      {},
      tag("p", { class: "eyebrow" }, "Curriculum vitæ"),
      tag("h1", {}, cv.profile.name),
      tag("p", { class: "headline" }, cv.profile.headline),
      renderContact(contact),
    ),
    renderEmblem(),
  );
}

/**
 * The game's map in miniature: four isometric quarters in the districts' colours (Skills
 * top, Experience right, Education left, the Projects quarter bottom).
 */
function renderEmblem(): Html {
  const quarter = (x: number, y: number, fill: string) =>
    `<polygon points="${String(x)},${String(y - 20)} ${String(x + 40)},${String(y)} ${String(x)},${String(y + 20)} ${String(x - 40)},${String(y)}" fill="${fill}" stroke="#fff" stroke-width="2"/>`;

  return raw(
    `<svg class="emblem" viewBox="0 0 160 100" role="img" aria-label="La carte du jeu : un quartier par section du CV">` +
      quarter(80, 25, sectionColour("skills")) +
      quarter(120, 45, sectionColour("experience")) +
      quarter(40, 45, sectionColour("education")) +
      quarter(80, 65, "#94a3b8") +
      `</svg>`,
  );
}

function renderSidebar(cv: Cv): Html[] {
  return [
    section("competences", "Compétences", "skills", ...renderSkills(cv)),
    cv.languages.length > 0 &&
      section("langues", "Langues", "education", renderLanguages(cv)),
    cv.education.length > 0 &&
      section("formation", "Formation", "education", renderEducation(cv)),
  ].filter((part): part is Html => part !== false);
}

function renderMain(cv: Cv, now: Date): Html[] {
  return [
    section(
      "profil",
      "Profil",
      undefined,
      tag(
        "div",
        { class: "summary" },
        cv.profile.summary.map((paragraph) => tag("p", {}, paragraph)),
      ),
    ),
    section(
      "experience",
      "Expérience",
      "experience",
      renderExperiences(cv, now),
    ),
    cv.projects.length > 0 &&
      section("projets", "Projets", undefined, renderProjects(cv)),
  ].filter((part): part is Html => part !== false);
}
