// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_RECRUITERS } from "../../../shared/recruiters";
import { IdentityPanel } from "../../../src/ui/IdentityPanel";

/** Returns the given values in order, then repeats the last one. */
function scripted(...values: number[]): () => number {
  let index = 0;

  return () => values[Math.min(index++, values.length - 1)];
}

function createPanel(random = scripted(0)) {
  const panel = new IdentityPanel(document.body, random);
  const root = panel.element;

  return {
    panel,
    dialog: root.querySelector<HTMLFormElement>("[role=dialog]")!,
    name: root.querySelector<HTMLInputElement>("#identity-name")!,
    company: root.querySelector<HTMLInputElement>("#identity-company")!,
    reroll: root.querySelector<HTMLButtonElement>(".identity-panel__reroll")!,
    start: root.querySelector<HTMLButtonElement>(".identity-panel__start")!,
    error: root.querySelector<HTMLParagraphElement>("[role=alert]")!,
  };
}

// F-012
describe("IdentityPanel", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("is a labelled modal dialog, hidden until asked", () => {
    const { panel, dialog } = createPanel();

    expect(panel.isOpen).toBe(false);
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(
      document.getElementById(dialog.getAttribute("aria-labelledby")!)
        ?.textContent,
    ).toBe("Who are you today?");
  });

  it("opens prefilled with a random recruiter, name focused", () => {
    const { panel, name, company } = createPanel(scripted(0));

    void panel.choose();

    expect(panel.isOpen).toBe(true);
    expect([name.value, company.value]).toEqual([
      DEFAULT_RECRUITERS[0].name,
      DEFAULT_RECRUITERS[0].company,
    ]);
    expect(document.activeElement).toBe(name);
  });

  it("limits the inputs to the allowed lengths", () => {
    const { name, company } = createPanel();

    expect([name.maxLength, company.maxLength]).toEqual([20, 24]);
  });

  it("picks another recruiter with 🎲", () => {
    const { panel, name, company, reroll } = createPanel(scripted(0, 0.9999));
    void panel.choose();

    reroll.click();

    expect([name.value, company.value]).toEqual([
      DEFAULT_RECRUITERS.at(-1)!.name,
      DEFAULT_RECRUITERS.at(-1)!.company,
    ]);
  });

  it("starts with the typed identity, cleaned up, and closes", async () => {
    const { panel, name, company, start } = createPanel();
    const chosen = panel.choose();

    name.value = "  Alex ";
    company.value = "SynergyCorp";
    start.click();

    await expect(chosen).resolves.toEqual({
      name: "Alex",
      company: "SynergyCorp",
    });
    expect(panel.isOpen).toBe(false);
  });

  it("stays open with an error when the identity isn't valid", () => {
    const { panel, name, start, error } = createPanel();
    let started = false;
    void panel.choose().then(() => {
      started = true;
    });

    name.value = "<b>Alex</b>";
    start.click();

    expect(panel.isOpen).toBe(true);
    expect(error.hidden).toBe(false);
    expect(error.textContent).toContain("1–20 characters");
    expect(started).toBe(false);
  });

  it("leaves the page when destroyed", () => {
    const { panel } = createPanel();

    panel.destroy();

    expect(document.body.contains(panel.element)).toBe(false);
  });
});
