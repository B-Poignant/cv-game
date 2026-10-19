// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { CONTACT } from "../../../src/content/contact";
import { CV } from "../../../src/content/cv";
import { groupByCompany } from "../../../src/cvPage/cvPageSections";
import { renderCvPage } from "../../../src/cvPage/renderCvPage";
import type { Cv } from "../../../src/domain/Cv";

const NOW = new Date("2026-10-19T00:00:00Z");
const OPTIONS = { gameUrl: "/", now: NOW };

/**
 * The page parsed into a document, to query it like a browser would. Without its <link>s:
 * happy-dom would fetch the web fonts, and tests stay off the network.
 */
function render(cv: Cv = CV, contact = CONTACT): Document {
  const html = renderCvPage(cv, contact, OPTIONS).replace(/<link[^>]*>/g, "");

  return new DOMParser().parseFromString(html, "text/html");
}

function texts(page: Document, selector: string): string[] {
  return [...page.querySelectorAll(selector)].map(
    (element) => element.textContent,
  );
}

// F-032
describe("renderCvPage", () => {
  it("is a French page titled with the owner's name and headline", () => {
    const html = renderCvPage(CV, CONTACT, OPTIONS);
    const page = render();

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(page.documentElement.lang).toBe("fr");
    expect(page.title).toBe(`${CV.profile.name} · ${CV.profile.headline}`);
    expect(page.querySelector("h1")?.textContent).toBe(CV.profile.name);
  });

  it("shows every summary paragraph", () => {
    expect(texts(render(), ".summary p")).toEqual(CV.profile.summary);
  });

  it("lists every role, with its company, period and technologies", () => {
    const page = render();

    expect(texts(page, ".role__title")).toEqual(
      CV.experiences.map((experience) => experience.role),
    );
    expect(texts(page, ".role__period")[0]).toBe(
      "juil. 2023 – aujourd'hui · 3 ans 4 mois",
    );
    expect(page.body.textContent).toContain("RabbitMQ");
  });

  it("groups back-to-back roles at one company, so a promotion reads as one stay", () => {
    const companies = texts(render(), ".company").map(
      (text) => text.split(/\d/)[0],
    );

    expect(companies).toEqual([
      "BoondManager",
      "PERI-G",
      "E-monsite",
      "Ciorane",
      "Locasun",
      "EISTI",
    ]);
    expect(groupByCompany(CV.experiences).map((roles) => roles.length)).toEqual(
      [1, 2, 2, 1, 1, 1],
    );
  });

  it("lists the skills by category, with their level for screen readers too", () => {
    const page = render();

    expect(texts(page, ".skills__category")).toEqual([
      ...new Set(CV.skills.map((skill) => skill.category)),
    ]);
    expect(texts(page, ".skill__name")).toEqual(
      CV.skills.map((skill) => skill.name),
    );
    const php = page.querySelector(".skill .level");
    expect(php?.getAttribute("aria-label")).toBe("Niveau 5 sur 5");
    expect(php?.querySelectorAll(".level__tile--on")).toHaveLength(5);
  });

  it("shows the education and the languages", () => {
    const body = render().body.textContent;

    expect(body).toContain(CV.education[0].diploma);
    expect(body).toContain(CV.education[0].school);
    expect(body).toContain("Capacité professionnelle complète");
  });

  it("links the contact details, the PDF and the game", () => {
    const page = render();
    const hrefs = [...page.querySelectorAll("a")].map((link) =>
      link.getAttribute("href"),
    );

    expect(hrefs).toEqual(
      expect.arrayContaining([
        `mailto:${CONTACT.email ?? ""}`,
        CONTACT.linkedin,
        CONTACT.cvPdf,
        "/",
      ]),
    );
  });

  it("leaves out what the CV doesn't have", () => {
    const page = render(
      { ...CV, projects: [], languages: [], education: [] },
      {},
    );

    expect(page.querySelector("#projets-title")).toBeNull();
    expect(page.querySelector("#langues-title")).toBeNull();
    expect(page.querySelector("#formation-title")).toBeNull();
    expect(page.querySelectorAll(".contact li")).toHaveLength(0);
  });

  it("shows projects once the CV has some", () => {
    const page = render({
      ...CV,
      projects: [
        {
          name: "cv-game",
          description: "Le CV en jeu",
          technologies: ["TypeScript", "Pixi.js"],
          url: "https://example.com",
        },
        { name: "Sans lien", description: "Local", technologies: [] },
      ],
    });

    expect(texts(page, "#projets-title")).toEqual(["Projets"]);
    expect(page.body.textContent).toContain("TypeScript · Pixi.js");
  });

  it("escapes CV text, so it can never inject markup", () => {
    const page = render({
      ...CV,
      profile: { ...CV.profile, name: `<img src=x onerror="alert(1)">` },
    });

    expect(page.querySelector("img")).toBeNull();
    expect(page.querySelector("h1")?.textContent).toBe(
      `<img src=x onerror="alert(1)">`,
    );
  });

  it("dates the page", () => {
    expect(render().querySelector(".footer")?.textContent).toBe(
      "Mis à jour le 19 octobre 2026.",
    );
  });
});
